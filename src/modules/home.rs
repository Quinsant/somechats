use rocket::{
    http::{Cookie, CookieJar},
    response::Redirect,
};

use rocket_dyn_templates::{context, Template};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use surrealdb::sql::Thing;

use crate::components::read_static_files;
use crate::DB;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct LoginData {
    login: String,
    password: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct UserID {
    id: Thing,
}

#[post("/<_..>")]
pub async fn check(cookie: &CookieJar<'_>) -> Result<(), Redirect> {
    let token = cookie.get_private("token");
    let private_key = cookie.get_private("private_key");

    match token.is_none() || private_key.is_none() {
        true => {
            cookie.remove_private(Cookie::named("token"));
            cookie.remove_private(Cookie::named("private_key"));
            cookie.remove(Cookie::named("theme"));
            Err(Redirect::to(uri!("/auth")))
        }
        false => Ok(()),
    }
}

#[get("/<_..>")]
pub async fn index(cookie: &CookieJar<'_>) -> Result<Template, Redirect> {
    let token = cookie.get_private("token");
    let private_key = cookie.get_private("private_key");

    match token.is_some() && private_key.is_some() {
        true => {
            let str_token = token.clone().unwrap().value().to_string();
            let query = format!("SELECT VALUE <string> user FROM {}", str_token.clone());
            let result: Option<String> = DB.query(query).await.unwrap().take(0).unwrap();

            match result.is_some() {
                true => {
                    let sf = read_static_files("home").await;
                    Ok(Template::render(
                        "index",
                        context! {script: sf.0, style: sf.1, folder: "home", title: "Дом"},
                    ))
                }
                false => {
                    cookie.remove_private(Cookie::named("token"));
                    cookie.remove_private(Cookie::named("private_key"));
                    cookie.remove(Cookie::named("theme"));
                    Err(Redirect::to(uri!("/auth")))
                }
            }
        }
        false => {
            cookie.remove_private(Cookie::named("token"));
            cookie.remove_private(Cookie::named("private_key"));
            cookie.remove(Cookie::named("theme"));
            Err(Redirect::to(uri!("/auth")))
        }
    }
}

#[post("/exit")]
pub async fn exit(cookie: &CookieJar<'_>) -> Value {
    let token = cookie.get_private("token");

    let _ = DB.query(format!("DELETE {}", token.unwrap().value())).await;
    cookie.remove_private(Cookie::named("token"));
    cookie.remove_private(Cookie::named("private_key"));
    cookie.remove(Cookie::named("theme"));
    json!({"success": true})
}
