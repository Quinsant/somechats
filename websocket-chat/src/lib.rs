use futures_util::{SinkExt, StreamExt};
use pkcs8::{DecodePrivateKey, DecodePublicKey};
use rsa::{Pkcs1v15Encrypt, PublicKey, RsaPrivateKey, RsaPublicKey};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use surrealdb::{engine::remote::http::Client, Surreal};
use tokio::{
    net::{TcpListener, TcpStream},
    spawn,
    sync::{
        broadcast::Receiver,
        mpsc::{unbounded_channel, UnboundedSender},
        oneshot::channel,
        Mutex,
    },
};
use tokio_tungstenite::{
    accept_async,
    tungstenite::{Error, Message, Result},
};

type Tx = UnboundedSender<Message>;
type PeerMap = Arc<Mutex<HashMap<SocketAddr, Tx>>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendData {
    pub id: String,
    pub chat: String,
    pub private_key: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct NewMsg {
    text: String,
    attached: Value,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct UserInfo {
    id: String,
    nickname: String,
    avatar: Value,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct UserMsg {
    id: String,
    user: UserInfo,
    message: NewMsg,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OldMsg {
    id: String,
    user: UserInfo,
    pub message: NewMsg,
    time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatPK {
    public_key: String,
}

type UserData = Arc<Mutex<HashMap<SocketAddr, SendData>>>;

#[derive(Debug, Clone)]
pub struct ChatServer();

impl ChatServer {
    async fn accept_connection(
        peer_map: PeerMap,
        raw_stream: TcpStream,
        addr: SocketAddr,
        users: UserData,
        user: SendData,
        db: Surreal<Client>,
    ) {
        if let Err(e) =
            Self::handle_connection(peer_map.clone(), raw_stream, addr, users.clone(), user, db)
                .await
        {
            match e {
                Error::ConnectionClosed | Error::Protocol(_) | Error::Utf8 => (),
                err => eprintln!("Ошибка обработки соединения: {}", err),
            }
        }
    }

    async fn check_user(users: HashMap<SocketAddr, SendData>, chat: String) -> Vec<SocketAddr> {
        let mut sockets_users = Vec::<SocketAddr>::new();
        for (sock, item) in users {
            if item.chat == chat {
                sockets_users.push(sock);
            }
        }
        //println!("{:#?}", sockets_users);
        sockets_users
    }

    async fn handle_connection(
        peer_map: PeerMap,
        raw_stream: TcpStream,
        addr: SocketAddr,
        users: UserData,
        user: SendData,
        db: Surreal<Client>,
    ) -> Result<()> {
        let ws_stream = accept_async(raw_stream).await.expect("Failed to accept");

        println!("Новое подключение:: {}", addr);

        let (mut ws_sender, mut ws_receiver) = ws_stream.split();

        // Echo incoming WebSocket messages and send a message periodically every second.
        let (tx, mut rx) = unbounded_channel();
        peer_map.lock().await.insert(addr, tx);
        users.lock().await.insert(addr, user.clone());

        let public_key: Option<ChatPK> = db
            .query(format!("SELECT public_key FROM {0};", user.chat))
            .await
            .unwrap()
            .take(0)
            .unwrap();

        let public_key = public_key.unwrap();
        let public_key = public_key.public_key.as_str();
        //println!("{}", public_key);
        let public_key = RsaPublicKey::from_public_key_pem(public_key).unwrap();

        let query = format!(
            "SELECT VALUE <string> password FROM {0}.chats WHERE chat = '{1}'",
            &user.id, &user.chat
        );

        let epassword: Option<String> = db.query(query).await.unwrap().take(0).unwrap();
        let epassword = epassword.unwrap();
        let epassword = base64::decode(epassword.as_bytes()).unwrap();

        let query = format!("SELECT VALUE <string> private_key FROM {}", &user.chat);
        let eprivat_key_chat: Option<String> = db.query(query).await.unwrap().take(0).unwrap();
        let eprivat_key_chat = eprivat_key_chat.unwrap();

        let privat_key = RsaPrivateKey::from_pkcs8_pem(&user.private_key).unwrap();

        let password = privat_key.decrypt(Pkcs1v15Encrypt, &epassword).unwrap();

        let private_key_chat =
            RsaPrivateKey::from_pkcs8_encrypted_pem(eprivat_key_chat.as_str(), &password).unwrap();

        let query = format!("SELECT <string> id, <string> message.text, message.attached, <string> user.id, user.avatar, user.nickname, <string> time FROM {}.messages ORDER BY time ASC;", &user.chat);
        let messages: Vec<OldMsg> = db.query(query).await.unwrap().take(0).unwrap();

        if !messages.is_empty() {
            for mut msg in messages {
                let pkc = private_key_chat.clone();
                let text_msg = msg.message.text;
                match !text_msg.is_empty() {
                    true => {
                        let text = base64::decode(text_msg).unwrap();
                        let text = pkc.decrypt(Pkcs1v15Encrypt, &text).unwrap();
                        let text = String::from_utf8(text).unwrap();
                        msg.message.text = text;
                        let item = Message::text(serde_json::to_string(&msg).unwrap());
                        ws_sender.send(item).await?;
                    }
                    false => continue,
                }
            }
        }

        loop {
            let public_key = public_key.clone();
            tokio::select! {
                msg = rx.recv() => {
                    let msg = msg.unwrap();
                    ws_sender.send(msg).await?;
                }
                msg = ws_receiver.next() => {
                    match msg {
                        Some(msg) => {
                            let msg = msg?;
                            let check_chat: Option<String> = db.query(format!("SELECT VALUE <string> id FROM {}", &user.chat)).await.unwrap().take(0).unwrap();
                            if msg.is_text() && !check_chat.is_none() {
                                let message: NewMsg = serde_json::from_str(&msg.to_string()).unwrap();
                                println!("{:#?}", message);

                                let text = message.clone().text;
                                let id = user.id.clone();
                                let chat_id = user.chat.clone();
                                let pool = db.clone();
                                let (tid, rid) = channel();
                                spawn(async move {

                                    let public_key = public_key.clone();

                                    let query: String;
                                    match text.is_empty() {
                                        true => {
                                            query = format!("
                                            LET $message = (CREATE messages CONTENT {{ user: {0}, message: {{text: '', attached: null }}, time: time::now()+3h }} RETURN id); 
                                            LET $message = (function($message) {{ return arguments[0]['id'] }} ); 
                                            UPDATE {1} SET messages += $message, update = time::unix(time::now());", 
                                            id, chat_id);
                                        },
                                        false => {
                                            let text = text.to_string();
                                            let mut rng = rand::thread_rng();
                                            let msgc = public_key.encrypt(&mut rng, Pkcs1v15Encrypt, &text.as_bytes()[..]).unwrap();
                                            let msgc = base64::encode(msgc);
                                            query = format!("
                                                LET $message = (CREATE messages CONTENT {{ user: {0}, message: {{text: '{1}', attached: null }}, time: time::now()+3h }} RETURN id); 
                                                LET $msg = (function($message) {{ return arguments[0]['id'] }} ); 
                                                UPDATE {2} SET messages += $msg, update = time::unix(time::now());
                                                SELECT VALUE <string> id FROM $message;", 
                                                id, msgc, chat_id);
                                        },
                                    }
                                    let id: Option<String> = pool.query(query).await.unwrap().take(3).unwrap();
                                    tid.send(id).unwrap()
                                });
                                let id = rid.await.unwrap().unwrap();
                                let query = format!("SELECT <string> id, avatar, nickname FROM {}", user.id.clone());
                                let user_info: Option<UserInfo> = db.query(query).await.unwrap().take(0).unwrap();

                                println!("{:#?}", user_info);

                                let user_msg = UserMsg {
                                    id: id,
                                    user: user_info.unwrap(),
                                    message: message
                                };

                                println!("{}", serde_json::to_string(&user_msg).unwrap());
                                let msg = Message::text(serde_json::to_string(&user_msg).unwrap());

                                let peers = peer_map.lock().await;
                                let sockets_users = Self::check_user(users.lock().await.clone(), user.chat.clone()).await;
                                // We want to broadcast the message to everyone except ourselves.
                                let broadcast_recipients =
                                    peers.iter().filter(|(peer_addr, _)| sockets_users.contains(peer_addr) && peer_addr != &&addr).map(|(_, ws_sink)| ws_sink);
                                println!("{:#?}", broadcast_recipients);

                                for recp in broadcast_recipients {
                                    match recp.is_closed() {
                                        true => continue,
                                        false => recp.send(msg.clone()).unwrap(),
                                    };
                                }
                                ws_sender.send(msg.clone()).await?;
                            } else if msg.is_close() {
                                break;
                            }
                        }
                        None => break,
                    }
                }
            }
        }
        println!("{} отключился", &addr);
        peer_map.lock().await.remove_entry(&addr);
        users.lock().await.remove_entry(&addr);
        Ok(())
    }

    pub async fn run(addr: String, port: u64, mut rx: Receiver<SendData>, db: Surreal<Client>) {
        let addr = format!("{0}:{1}", addr, port);

        let state = PeerMap::new(Mutex::new(HashMap::new()));
        let users = UserData::new(Mutex::new(HashMap::new()));

        let listener = TcpListener::bind(&addr).await.expect("Не могу прослушать");
        println!("Запуск сервера чата. Прослушивается: {}", addr);

        while let Ok((stream, _)) = listener.accept().await {
            let peer = stream
                .peer_addr()
                .expect("подключенные потоки должны иметь одноранговый адрес");
            println!("Адрес пира: {}", peer);
            let user = rx.recv().await.unwrap();
            tokio::spawn(Self::accept_connection(
                state.clone(),
                stream,
                peer,
                users.clone(),
                user,
                db.clone(),
            ));
        }
    }
}
