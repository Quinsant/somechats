use std::{fs, path::Path};

use pkcs8::{DecodePrivateKey, DecodePublicKey, EncodePrivateKey, EncodePublicKey};
use rand::{distributions::Alphanumeric, thread_rng, Rng};

use crate::{SqlFiles, DB};
use rocket::{
    data::Capped, form::Form, fs::TempFile, http::CookieJar, response::Redirect, serde::json::Json,
    State,
};
use rsa::{Pkcs1v15Encrypt, PublicKey, RsaPrivateKey, RsaPublicKey};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::str;
use tokio::{fs::create_dir, spawn};

#[get("/")]
pub async fn index() -> Redirect {
    Redirect::to("/home")
}

#[derive(Debug, Clone, Deserialize, Serialize, FromForm)]
#[serde(crate = "rocket::serde")]
pub struct Data {
    value: String,
}

#[post("/nickname", format = "json", data = "<data>")]
pub async fn nickname(data: Json<Data>, cookie: &CookieJar<'_>) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();

    let query = format!(
        "UPDATE users SET nickname = '{0}' WHERE {1}.user = id",
        data.value, token
    );
    DB.query(query).await.unwrap();
    json!({"success": true})
}

#[derive(FromForm, Debug)]
pub struct File<'f> {
    value: Capped<TempFile<'f>>,
}

async fn rand_file_name(ex: &str) -> String {
    let s: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(20)
        .map(char::from)
        .collect();
    let name = format!("{0}.{1}", s, ex);
    return name;
}

#[post("/avatar", data = "<upload>")]
pub async fn avatar(mut upload: Form<File<'_>>, cookie: &CookieJar<'_>) -> Value {
    if upload.value.is_complete() {
        let token = cookie.get_private("token").unwrap().value().to_string();
        let query = format!("SELECT VALUE avatar FROM users WHERE {}.user = id", token);
        let old_avatar: Option<String> = DB.query(query).await.unwrap().take(0).unwrap();

        println!("{:#?}", old_avatar);
        if old_avatar.is_some() {
            fs::remove_file(format!("./userdata/avatar/{}", old_avatar.unwrap())).unwrap();
        }

        let ex = upload
            .value
            .content_type()
            .unwrap()
            .media_type()
            .sub()
            .as_str();

        let folder_avatar = Path::new("./userdata");
        if !folder_avatar.exists() {
            create_dir(folder_avatar).await.unwrap();
        }

        let mut name = rand_file_name(ex).await;
        let mut path = format!("./userdata/avatar/{}", name);

        while Path::new(&path).exists() {
            name = rand_file_name(ex).await;
            path = format!("./base/avatar/{}", name);
        }

        upload.value.persist_to(&path).await.unwrap();

        let query = format!(
            "UPDATE users SET avatar = '{0}' WHERE {1}.user = id",
            name, &token
        );
        DB.query(query).await.unwrap();
        json!({"success": true})
    } else {
        json!({"success": false})
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct Theme {
    mode: String,
    primary: String,
    secondary: String,
}

#[post("/theme", format = "json", data = "<theme>")]
pub async fn theme(cookie: &CookieJar<'_>, theme: Json<Theme>) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();

    let query = format!(
        "UPDATE users SET theme = $input WHERE {0}.user = id;",
        &token
    );
    DB.query(query).bind(("input", theme.0)).await.unwrap();
    json!({"success": true})
}

#[post("/retheme")]
pub async fn retheme(cookie: &CookieJar<'_>) {
    let token = cookie.get_private("token").unwrap().value().to_string();
    let query = format!("UPDATE users SET theme = null WHERE {}.user = id", &token);
    DB.query(query).await.unwrap();
}

#[post("/delavatar")]
pub async fn delavatar(cookie: &CookieJar<'_>) {
    let token = cookie.get_private("token").unwrap().value().to_string();

    let query = format!("SELECT VALUE avatar FROM users WHERE {}.user = id", token);
    let old_avatar: Option<String> = DB.query(query).await.unwrap().take(0).unwrap();

    fs::remove_file(format!("./userdata/avatar/{}", old_avatar.unwrap())).unwrap();

    let query = format!("UPDATE users SET avatar = null WHERE {}.user = id", &token);
    DB.query(query).await.unwrap();
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct ReData<'a> {
    password: &'a str,
    redata: &'a str,
}

#[post("/repassword", format = "json", data = "<data>")]
pub async fn repassword(cookie: &CookieJar<'_>, data: Json<ReData<'_>>) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();

    let query = format!(
        "SELECT VALUE password FROM users WHERE {}.user = id",
        &token
    );
    let pdb: Option<String> = DB.query(query).await.unwrap().take(0).unwrap();

    let old_password = data.password.to_string();

    match pwhash::bcrypt::verify(&old_password, &pdb.unwrap()) {
        true => {
            let new_password = data.redata;
            let mut private_key = cookie
                .get_private("private_key")
                .unwrap()
                .value()
                .to_string();
            let pbytes = new_password.to_string();

            let task = spawn(async move {
                let rsa_pv = RsaPrivateKey::from_pkcs8_pem(&private_key).unwrap();

                let rng = rand::thread_rng();

                private_key = rsa_pv
                    .to_pkcs8_encrypted_pem(rng, pbytes.as_bytes(), pkcs8::LineEnding::CRLF)
                    .unwrap()
                    .to_string();
                private_key
            });

            let new_password = pwhash::bcrypt::hash(new_password).unwrap();
            let pk = task.await.unwrap();
            let query = format!("UPDATE users SET password = '{0}', private_key = '{1}' WHERE {2}.user = id RETURN NONE;", new_password, pk, token);
            DB.query(query).await.unwrap();
            json!({"success": true})
        }
        false => {
            json!({"success": false, "answer": "Неверный пароль!"})
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct DataNotice {
    id: String,
}

#[post("/notices/rmnotice", format = "json", data = "<data>")]
pub async fn rmnotice(
    data: Json<DataNotice>,
    cookie: &CookieJar<'_>,
    sql_files: &State<SqlFiles>,
) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();
    let res: Vec<&str> = data.id.split(":").map(|s| s).collect();

    match res[0] {
        "users" => {
            let query =
                String::from_utf8(sql_files.get("rm-notice.suql").unwrap().data.to_vec()).unwrap();

            DB.query(query)
                .bind(("input", token))
                .bind(("input1", &data.id))
                .await
                .expect("Error in notices");
        }
        "notices" => {
            let query = format!(
                "LET $id = (SELECT VALUE id FROM users WHERE <string> {0}.user = id);
                 LET $id = (function($id) {{return arguments[0][0] }});
                 UPDATE $id SET notices -= <string> {1}; DELETE '{1}'",
                &token, &data.id
            );
            DB.query(query).await.expect("Error in notices");
        }
        &_ => println!("{} - error", res[0]),
    }
    json!({"success": true})
}

#[post("/search/addnotice", format = "json", data = "<data>")]
pub async fn addnotice(
    cookie: &CookieJar<'_>,
    data: Json<DataNotice>,
    sql_files: &State<SqlFiles>,
) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();

    let query = format!(
        "LET $id = (SELECT VALUE id FROM users WHERE {0}.user = id);
        LET $id = (function($id) {{return arguments[0][0] }});
        LET $n = (SELECT VALUE user FROM notices WHERE id INSIDE $id.notices && type.key = 'friend');
        IF {1} NOTINSIDE $n THEN true ELSE false END",
        token, &data.id
    );

    let status: Option<bool> = DB.query(query).await.unwrap().take(3).unwrap();

    match status.unwrap() {
        true => {
            let query =
                String::from_utf8(sql_files.get("set-notice.suql").unwrap().data.to_vec()).unwrap();

            let answer: Option<Value> = DB
                .query(query)
                .bind(("input", token))
                .bind(("input1", &data.id))
                .await
                .unwrap()
                .take(4)
                .unwrap();
            json!(answer.unwrap())
        }
        false => {
            let query =
                String::from_utf8(sql_files.get("set-friend.suql").unwrap().data.to_vec()).unwrap();

            let answer: Option<Value> = DB
                .query(query)
                .bind(("input", token))
                .bind(("input1", &data.id))
                .await
                .unwrap()
                .take(9)
                .unwrap();
            json!(answer.unwrap())
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct DataFriend {
    id: String,
    answer: bool,
}

#[post("/notices/addfriend", format = "json", data = "<data>")]
pub async fn addfriend(
    data: Json<DataFriend>,
    cookie: &CookieJar<'_>,
    sql_files: &State<SqlFiles>,
) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();

    match data.answer {
        true => {
            let query =
                String::from_utf8(sql_files.get("set-friend.suql").unwrap().data.to_vec()).unwrap();

            let answer: Option<Value> = DB
                .query(query)
                .bind(("input", token))
                .bind(("input1", &data.id))
                .await
                .unwrap()
                .take(9)
                .unwrap();
            json!(answer.unwrap())
        }
        false => {
            let query =
                String::from_utf8(sql_files.get("reject-friend.suql").unwrap().data.to_vec())
                    .unwrap();

            let answer: Option<Value> = DB
                .query(query)
                .bind(("input", token))
                .bind(("input1", &data.id))
                .await
                .unwrap()
                .take(8)
                .unwrap();
            json!(answer.unwrap())
        }
    }
}

#[post("/friends/rmfriend", format = "json", data = "<data>")]
pub async fn rmfriend(
    data: Json<DataNotice>,
    cookie: &CookieJar<'_>,
    sql_files: &State<SqlFiles>,
) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();

    let query = String::from_utf8(sql_files.get("rm-friend.suql").unwrap().data.to_vec()).unwrap();

    match DB
        .query(query)
        .bind(("input", token))
        .bind(("input1", &data.id))
        .await
    {
        Ok(_) => json!({"success": true}),
        Err(k) => json!({"success": false}),
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct UserPublicKey {
    public_key: String,
}
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct NewChat {
    user: String,
    input: String,
    private_key: String,
    public_key: String,
    me_key: String,
    user_key: String,
}
#[post("/chats/new", format = "json", data = "<data>")]
pub async fn newchat(
    data: Json<DataNotice>,
    cookie: &CookieJar<'_>,
    sql_files: &State<SqlFiles>,
) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();

    let query = String::from_utf8(sql_files.get("check-chat.suql").unwrap().data.to_vec()).unwrap();

    let res: Option<Value> = DB
        .query(query)
        .bind(("input", &token))
        .bind(("input1", &data.id))
        .await
        .unwrap()
        .take(2)
        .unwrap();

    match res.is_none() {
        true => {
            let get_pku: Option<UserPublicKey> = DB
                .query(format!("SELECT public_key FROM {}", data.id))
                .await
                .unwrap()
                .take(0)
                .unwrap();
            let get_pku = get_pku.unwrap();
            let public_key_user =
                RsaPublicKey::from_public_key_pem(get_pku.public_key.as_str()).unwrap();
            let private_key =
                RsaPrivateKey::from_pkcs8_pem(cookie.get_private("private_key").unwrap().value())
                    .unwrap();

            let keys = spawn(async move {
                let mut rng = rand::thread_rng();
                let bits = 2048;

                let chat_password: String = rand::thread_rng()
                    .sample_iter(&Alphanumeric)
                    .take(75)
                    .map(char::from)
                    .collect();

                let private_key_chat =
                    RsaPrivateKey::new(&mut rng, bits).expect("failed to generate a key");

                let pem_priv_key = private_key_chat
                    .to_pkcs8_encrypted_pem(
                        &mut rng,
                        &chat_password.as_bytes(),
                        pkcs8::LineEnding::CRLF,
                    )
                    .unwrap();
                let pem_priv_key = pem_priv_key.to_string();

                let pem_pub_key = private_key_chat
                    .to_public_key_pem(pkcs8::LineEnding::CRLF)
                    .unwrap();

                let me_key = private_key
                    .encrypt(&mut rng, Pkcs1v15Encrypt, &chat_password.as_bytes())
                    .unwrap();
                let me_key = base64::encode(me_key);
                let user_key = public_key_user
                    .encrypt(&mut rng, Pkcs1v15Encrypt, &chat_password.as_bytes())
                    .unwrap();
                let user_key = base64::encode(user_key);

                let data = NewChat {
                    user: data.id.clone(),
                    input: token,
                    private_key: pem_priv_key,
                    public_key: pem_pub_key,
                    me_key: me_key,
                    user_key: user_key,
                };
                data
            });
            let query =
                String::from_utf8(sql_files.get("set-chat.suql").unwrap().data.to_vec()).unwrap();
            let data = keys.await.unwrap();

            let res: Option<String> = DB.query(query).bind(data).await.unwrap().take(3).unwrap();
            // .to_string()
            // .replace("\"", "")
            // .replace("chats:", "");
            let mut res = res.unwrap();
            res = res.replace("\"", "").replace("chats:", "");
            json!({"success": true, "id": res})
        }
        false => {
            let check = res.unwrap();
            let id = check.to_string().replace("\"", "").replace("chats:", "");
            json!({"success": true, "id": id})
        }
    }
}

// #[post("/reemail", format="json", data="<data>")]
// pub async fn reemail(pool: &State<SurrealDB>, cookie: &CookieJar<'_>, data: Json<ReData>) -> Value {
//     let token = cookie.get_private("token").unwrap().value().to_string();

//     let query = suql_query!(format!(
//         "SELECT email FROM users WHERE email = '{}'",
//         data.redata
//     ));
//     let emails = pool
//         .query(query)
//         .await
//         .unwrap()
//         .fetch_by_key(0)
//         .result
//         .as_array()
//         .unwrap()
//         .clone();
//     println!("{:#?}", emails);
//     match emails.is_empty() {
//         true => {
//             let query = suql_query!(format!(
//                 "SELECT password FROM users WHERE crypto::argon2::compare('{}', id);",
//                 token
//             ));
//             let pdb = pool
//                 .query(query)
//                 .await
//                 .unwrap()
//                 .fetch_by_key(0)
//                 .get_answer(0)["password"]
//                 .as_str()
//                 .unwrap()
//                 .to_string();
//             match pwhash::bcrypt::verify(data.password.clone(), &pdb) {
//                 true => {
//                     let query = suql_query!(format!("UPDATE users SET email = '{0}' WHERE crypto::argon2::compare({1}, id) RETURN NONE;", data.redata, token));
//                     pool.query(query).await.unwrap();
//                     json!({"success": true})
//                 }
//                 false => {
//                     json!({"success": false, "answer": "Неверный пароль!"})
//                 }
//             }
//         }
//         false => {
//             json!({"success": false, "answer": "E-mail уже занят!"})
//         }
//     }
// }
