use pkcs8::{DecodePrivateKey, EncodePrivateKey, EncodePublicKey};
use rocket::futures::channel::oneshot::channel;
use rocket::http::{Cookie, CookieJar};
use rocket::response::Redirect;
use rocket::serde::json::Json;
use rocket::State;
use rocket_client_addr::ClientAddr;
use rocket_dyn_templates::{context, Template};
use rsa::RsaPrivateKey;
use serde::Deserialize;
use serde::Serialize;
use serde_json::{json, Value};

use crate::components::read_static_files;
use crate::{sql_file, SqlFiles, DB};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct InputData<'a> {
    pub login: &'a str,
    pub password: &'a str,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Login<'a> {
    login: &'a str,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(crate = "rocket::serde")]
struct NewUser {
    login: String,
    password: String,
    pub_key: String,
    priv_key: String,
    addr: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(crate = "rocket::serde")]
struct UserInfo {
    login: String,
    avatar: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(crate = "rocket::serde")]
struct UserDB {
    password: String,
    private_key: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(crate = "rocket::serde")]
struct AuthInput {
    login: String,
    addr: String,
}

#[post("/signup", format = "json", data = "<data>")]
pub async fn reg(
    data: Json<InputData<'_>>,
    cookie: &CookieJar<'_>,
    caddr: &ClientAddr,
    sql_files: &State<SqlFiles>,
) -> Value {
    let password = data.password.to_string();
    let login = data.login.to_string();

    let password_hash = pwhash::bcrypt::hash(&password).unwrap();

    //println!("{:#?}", data.login.as_str());
    let query = String::from_utf8(sql_files.get("check-reg.suql").unwrap().data.to_vec()).unwrap();

    let query: Option<bool> = DB
        .query(query)
        .bind(("input", &login))
        .await
        .unwrap()
        .take(1)
        .unwrap();

    match query.unwrap() {
        true => {
            let (tx, rx) = channel();

            tokio::spawn(async move {
                let mut rng = rand::thread_rng();
                let bits = 2048;
                let private_key =
                    RsaPrivateKey::new(&mut rng, bits).expect("failed to generate a key");

                let pem_str_priv = private_key
                    .to_pkcs8_pem(pkcs8::LineEnding::CRLF)
                    .unwrap()
                    .to_string();

                let pem_priv_key = private_key
                    .to_pkcs8_encrypted_pem(rng, &password.as_bytes(), pkcs8::LineEnding::CRLF)
                    .unwrap();
                let pem_priv_key = pem_priv_key.to_string();

                let pem_pub_key = private_key
                    .to_public_key_pem(pkcs8::LineEnding::CRLF)
                    .unwrap();

                tx.send((pem_str_priv, pem_priv_key, pem_pub_key)).unwrap();
            });

            let keys = rx.await.unwrap();

            let addr = caddr.get_ipv4_string().unwrap();

            let query = String::from_utf8(sql_files.get("create-user.suql").unwrap().data.to_vec())
                .unwrap();

            let session_key: Option<String> = DB
                .query(query)
                .bind(NewUser {
                    login: login,
                    password: password_hash,
                    priv_key: keys.1,
                    pub_key: keys.2,
                    addr: addr,
                })
                .await
                .unwrap()
                .take(2)
                .unwrap();

            cookie.add_private(Cookie::new("private_key", keys.0));
            cookie.add_private(Cookie::new("token", session_key.unwrap()));
            json!({"success": true})
        }
        false => {
            json!({
                "success": false,
            })
        }
    }
}

#[post("/check", format = "json", data = "<login>")]
pub async fn check_user(login: Json<Login<'_>>) -> Value {
    let query: Option<Value> = DB
        .query("SELECT nickname, avatar FROM users WHERE login = <string> $login")
        .bind(("login", login.login))
        .await
        .unwrap()
        .take(0)
        .unwrap();
    match query {
        Some(o) => json!(o),
        None => json!({ "nickname": null }),
    }
}
#[post("/login", format = "json", data = "<data>")]
pub async fn login(
    data: Json<InputData<'_>>,
    cookie: &CookieJar<'_>,
    caddr: &ClientAddr,
    sql_files: &State<SqlFiles>,
) -> Value {
    let query: Option<UserDB> = DB
        .query("SELECT password, private_key FROM users WHERE login = <string> $login;")
        .bind(("login", data.login))
        .await
        .unwrap()
        .take(0)
        .unwrap();

    let password_db = query.clone().unwrap().password;
    let private_key = query.unwrap().private_key;

    let rsa_key = RsaPrivateKey::from_pkcs8_encrypted_pem(private_key.as_str(), data.password);

    let verify = pwhash::bcrypt::verify(&data.password, password_db.as_str());
    match verify && rsa_key.is_ok() {
        true => {
            let addr = caddr.get_ipv4_string().unwrap();

            let query =
                String::from_utf8(sql_files.get("auth-user.suql").unwrap().data.to_vec()).unwrap();

            let session_key: Option<String> = DB
                .query(query)
                .bind(AuthInput {
                    login: data.login.to_string(),
                    addr: addr,
                })
                .await
                .unwrap()
                .take(2)
                .unwrap();

            let private_key = rsa_key
                .unwrap()
                .to_pkcs8_pem(pkcs8::LineEnding::CRLF)
                .unwrap()
                .to_string();

            cookie.add_private(Cookie::new("token", session_key.unwrap()));
            cookie.add_private(Cookie::new("private_key", private_key));
            json!({"success": true})
        }
        false => {
            json!({"success": false})
        }
    }
}

#[get("/")]
pub async fn index(cookie: &CookieJar<'_>) -> Result<Template, Redirect> {
    let token = cookie.get_private("token");
    let private_key = cookie.get_private("private_key");
    match token.is_none() | private_key.is_none() {
        true => {
            cookie.remove_private(Cookie::named("token"));
            cookie.remove_private(Cookie::named("private_key"));
            let sf = read_static_files("auth").await;
            Ok(Template::render(
                "index",
                context! {script: sf.0, style: sf.1, folder: "auth", title: "Вход"},
            ))
        }
        false => Err(Redirect::to(uri!("/home"))),
    }
}
