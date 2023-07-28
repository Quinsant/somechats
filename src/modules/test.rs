#[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
struct Message {
    #[field(validate = len(..30))]
    pub room: String,
    #[field(validate = len(..20))]
    pub username: String,
    pub message: String,
}

/// Returns an infinite stream of server-sent events. Each event is a message
/// pulled from a broadcast queue sent by the `post` handler.
#[get("/home/events")]
async fn events(queue: &State<Sender<Message>>, mut end: Shutdown) -> EventStream![] {
    let mut rx = queue.subscribe();
    EventStream! {
        loop {
            let msg = select! {
                msg = rx.recv() => match msg {
                    Ok(msg) => msg,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };
            
            yield Event::json(&msg);
        }
    }
}

/// Receive a message from a form submission and broadcast it to any receivers.
#[post("/home/message", data = "<form>")]
async fn post(form: Form<Message>, queue: &State<Sender<Message>>) {
    // A send 'fails' if there are no active subscribers. That's okay.
    let _res = queue.send(form.into_inner());
}

#[derive(Debug, Clone, FromForm, Serialize, Deserialize, PartialEq, Eq)]
#[serde(crate = "rocket::serde")]
pub struct Room {
    pub id: String,
    pub name: String,
}

// #[get("/rooms")]
// async fn rooms(pool: &State<MySQLi>) -> Json<Vec<Room>> {
//     let k = pool
//         .query_return("SELECT id, name FROM rooms", |(id, name)| Room { id, name })
//         .unwrap();
//     return Json(k);
// }