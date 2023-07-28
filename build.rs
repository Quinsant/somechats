use static_files::resource_dir;

fn main() {
    resource_dir("./sql").build().unwrap();
}
