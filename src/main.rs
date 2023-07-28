#![feature(decl_macro)]
#[macro_use]
extern crate rocket;
extern crate rocket_dyn_templates;
extern crate tokio;

use std::collections::HashMap;
use std::path::Path;
use std::thread;
use std::time::Duration;

use rocket::figment::providers::{Format, Toml};
use rocket::fs::FileServer;
use rocket::response::Redirect;
use rocket::Config;

use rocket_dyn_templates::Template;
use serde::Deserialize;
use surrealdb::engine::remote::http::{Client, Http};
use surrealdb::opt::auth::Root;
use surrealdb::Surreal;

use rocket::{Build, Rocket};

use tokio::fs::create_dir;

use tokio::spawn;
use tokio::sync::broadcast::channel;
use websocket_chat::ChatServer;

#[path = "modules/auth.rs"]
mod auth;
#[path = "./components.rs"]
mod components;
#[path = "modules/gets.rs"]
mod gets;
#[path = "modules/home.rs"]
mod home;
#[path = "modules/sets.rs"]
mod sets;

include!(concat!(env!("OUT_DIR"), "/generated.rs"));
pub type SqlFiles = HashMap<&'static str, static_files::Resource>;

// ========== DataBase ==========
static DB: Surreal<Client> = Surreal::<Client>::init();
// ==============================

#[derive(Deserialize, Debug, Clone)]
struct Database {
    host: String,
    port: String,
    login: String,
    password: String,
    namespace: String,
    database: String,
}

async fn offline() {
    spawn(async move {
        loop {
            let query = "UPDATE users SET online = false WHERE online = true;";
            DB.query(query).await.unwrap();
            thread::sleep(Duration::from_secs(120));
        }
    });
}

// #[catch(404)]
// fn not_found() -> Redirect {
//     Redirect::to(uri!("/"))
// }

pub struct RocketStart {
    build: Rocket<Build>,
}

#[get("/")]
fn index() -> Redirect {
    Redirect::to(uri!("/home"))
}
// Созадть отдельный impl для подключения к базе данных. init() - ввод данных (хост, порт, данные для аутентификации, ...), connect() - подключение
impl RocketStart {
    pub async fn new() -> Result<RocketStart, surrealdb::Error> {
        let db_cfg: Database = Toml::from_path(Path::new("Database.toml")).unwrap();
        match DB
            .connect::<Http>(format!("{0}:{1}", db_cfg.host, db_cfg.port))
            .await
        {
            Ok(_) => {
                DB.signin(Root {
                    username: &db_cfg.login,
                    password: &db_cfg.password,
                })
                .await
                .expect("Error login SurrealDB");

                DB.use_ns(db_cfg.namespace)
                    .use_db(db_cfg.database)
                    .await
                    .unwrap();

                offline().await;

                let figment = Config::figment().merge(Toml::file("Config.toml").nested());

                let config = Config::from(figment);

                let (tx, rx) = channel(10);
                tokio::spawn(async move {
                    ChatServer::run(config.address.to_string(), 3300, rx, DB.clone()).await
                });
                let start = rocket::build()
                    .attach(Template::fairing())
                    .manage(tx)
                    .configure(config);

                Ok(RocketStart { build: start })
            }
            Err(err) => Err(err),
        }
    }
    pub async fn mount_all(self) -> Rocket<Build> {
        self.build
            // .register("/", catchers![not_found])
            .mount("/", routes![index])
            .mount("/static", FileServer::from("./static"))
            // Home
            .mount(
                "/home",
                routes![
                    home::index,
                    home::exit,
                    gets::search,
                    gets::userdata,
                    sets::addnotice,
                    gets::notices,
                    sets::addfriend,
                    sets::rmnotice,
                    gets::friends,
                    sets::rmfriend,
                    sets::newchat,
                    gets::chats,
                    gets::chatget
                ],
            )
            // Authentication
            .mount(
                "/auth",
                routes![auth::reg, auth::check_user, auth::login, auth::index],
            )
            // Get Data
            .mount("/avatar", FileServer::from("./userdata/avatar"))
            // Set Data
            .mount(
                "/home/set",
                routes![
                    sets::index,
                    sets::nickname,
                    sets::avatar,
                    sets::theme,
                    sets::retheme,
                    sets::delavatar,
                    sets::repassword
                ],
            )
    }
}

async fn path_check() -> Result<(), ()> {
    let static_folder = Path::new("./static");
    match static_folder.exists() {
        true => println!("Папка static уже существует."),
        false => {
            let sf = create_dir(static_folder).await;
            match sf {
                Ok(_) => println!("Папка static создана."),
                Err(err) => panic!("Ошибка при создание папки статических файлов: {err}"),
            }
        }
    };
    let temp_folder = Path::new("./temp");
    match static_folder.exists() {
        true => println!("Папка temp уже существует."),
        false => {
            let sf = create_dir(temp_folder).await;
            match sf {
                Ok(_) => println!("Папка temp создана."),
                Err(err) => panic!("Ошибка при создание временной папки: {err}"),
            }
        }
    };
    let userdata_folder = Path::new("./userdata");
    match static_folder.exists() {
        true => println!("Папка userdata уже существует."),
        false => {
            let sf = create_dir(userdata_folder).await;
            match sf {
                Ok(_) => println!("Папка userdata создана."),
                Err(err) => panic!("Ошибка при создание папки пользовательских данных: {err}"),
            }
        }
    };
    Ok(())
}

#[launch]
#[tokio::main(flavor = "multi_thread")]
async fn rocket() -> _ {
    let sql_files: SqlFiles = generate();

    match path_check().await {
        Ok(_) => match RocketStart::new().await {
            Ok(o) => o.mount_all().await.manage(sql_files),
            Err(e) => panic!("Ошибка при подключение к БД\n{e}"),
        },
        Err(_) => panic!(),
    }
}
