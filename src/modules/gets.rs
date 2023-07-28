use rocket::{
    http::CookieJar,
    response::stream::{Event, EventStream},
    serde::json::Json,
    State,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use strsim::normalized_levenshtein;
use tokio::{sync::broadcast::Sender, time};
use websocket_chat::SendData;

use crate::{SqlFiles, DB};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(crate = "rocket::serde")]
struct UserData {
    avatar: Value,
    online: Value,
    login: Value,
    nickname: Value,
    notices: Value,
    theme: Value,
}

#[get("/userdata")]
pub async fn userdata(cookie: &CookieJar<'_>, sql_files: &State<SqlFiles>) -> EventStream![] {
    let token = cookie.get_private("token").unwrap().value().to_string();
    let query = String::from_utf8(sql_files.get("user-data.suql").unwrap().data.to_vec()).unwrap();

    EventStream! {
        let mut interval = time::interval(time::Duration::from_millis(2750));
        loop {
            let result: Option<UserData> = DB.query(&query).bind(("input", &token)).await.unwrap().take(4).unwrap();
            yield Event::json(&result.unwrap());
            interval.tick().await;
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Search {
    value: String,
}

#[post("/search/people", format = "json", data = "<data>")]
pub async fn search(
    data: Json<Search>,
    cookie: &CookieJar<'_>,
    sql_files: &State<SqlFiles>,
) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();

    let query = String::from_utf8(sql_files.get("get-search.suql").unwrap().data.to_vec()).unwrap();

    let result: Vec<Value> = DB
        .query(query)
        .bind(("input", &token))
        .await
        .unwrap()
        .take(5)
        .unwrap();

    let mut answer = Vec::<Value>::new();

    match data.value.starts_with("@") {
        true => {
            let mut chars = data.value.chars();
            chars.next();
            let value = chars.as_str();

            for item in result {
                if normalized_levenshtein(item["login"].as_str().unwrap(), value) >= 0.45 {
                    answer.push(item);
                } else {
                    continue;
                }
            }
        }
        false => {
            for item in result {
                if normalized_levenshtein(
                    item["nickname"].as_str().unwrap(),
                    &data.value.to_lowercase(),
                ) >= 0.45
                {
                    answer.push(item);
                } else {
                    continue;
                }
            }
        }
    }
    json!(answer)
}

#[get("/notices/data")]
pub async fn notices(cookie: &CookieJar<'_>) -> EventStream![] {
    let token = cookie.get_private("token").unwrap().value().to_string();

    EventStream! {
        let mut interval = time::interval(time::Duration::from_millis(2750));
        loop {
            let query = format!("SELECT type, time, <string> id, user.nickname, user.avatar, <string> user.id FROM notices WHERE id INSIDE {}.user.notices ORDER BY time DESC;
            ", &token);
            let result: Vec<Value> = DB.query(&query).await.unwrap().take(0).unwrap();
            yield Event::json(&json!(result));
            interval.tick().await;
        }
    }
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
struct Friend {
    id: Value,
    avatar: Value,
    online: Value,
    login: Value,
    nickname: Value,
}

#[get("/friends/data")]
pub async fn friends(cookie: &CookieJar<'_>, sql_files: &State<SqlFiles>) -> EventStream![] {
    let token = cookie.get_private("token").unwrap().value().to_string();
    let query =
        String::from_utf8(sql_files.get("get-friends.suql").unwrap().data.to_vec()).unwrap();

    EventStream! {
        let mut interval = time::interval(time::Duration::from_millis(2750));
        loop {
            let result: Vec<Friend> = DB.query(&query).bind(("input", &token)).await.unwrap().take(2).unwrap();
            yield Event::json(&result);
            interval.tick().await;
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Password {
    password: Vec<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatPK {
    private_key: String,
}

#[get("/chats/all")]
pub async fn chats(cookie: &CookieJar<'_>, sql_files: &State<SqlFiles>) -> EventStream![] {
    let token = cookie.get_private("token").unwrap().value().to_string();
    let query = String::from_utf8(sql_files.get("get-chats.suql").unwrap().data.to_vec()).unwrap();

    EventStream! {
        let mut interval = time::interval(time::Duration::from_millis(2750));
        loop {
            let result: Vec<Value> = DB.query(&query).bind(("input", &token)).await.unwrap().take(3).unwrap();
            yield Event::json(&json!(result));
            interval.tick().await;
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(crate = "rocket::serde")]
pub struct Id {
    id: String,
}

#[post("/chats/<id>/get")]
pub async fn chatget(
    cookie: &CookieJar<'_>,
    id: String,
    server: &State<Sender<SendData>>,
    sql_files: &State<SqlFiles>,
) -> Value {
    let token = cookie.get_private("token").unwrap().value().to_string();
    let private_key = cookie
        .get_private("private_key")
        .unwrap()
        .value()
        .to_string();

    let query = String::from_utf8(sql_files.get("chat.suql").unwrap().data.to_vec()).unwrap();

    let res: Option<Value> = DB
        .query(query)
        .bind(("input", &token))
        .bind(("input1", &id))
        .await
        .unwrap()
        .take(2)
        .unwrap();

    match res.is_some() {
        true => {
            let data = res.unwrap();

            let query = format!(
                "SELECT VALUE <string> id FROM users WHERE {}.user = id;",
                &token
            );
            let get_me_id: Option<String> = DB.query(query).await.unwrap().take(0).unwrap();

            let me_id = get_me_id.unwrap();

            let info = SendData {
                id: me_id.clone(),
                chat: format!("chats:{}", id),
                private_key: private_key,
            };
            server.send(info).unwrap();
            json!({"success": true, "data": data, "meId": me_id})
        }
        false => {
            json!({"success": false})
        }
    }
}
