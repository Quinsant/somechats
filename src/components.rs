use std::{ffi::OsStr, fs};

pub async fn read_static_files(folder: &str) -> (String, String) {
    let files = fs::read_dir(format!("./static/{}", folder)).unwrap();

    let mut script = String::new();
    let mut style = String::new();

    for file_src in files {
        match file_src {
            Ok(f) => match f.path().extension().and_then(OsStr::to_str).unwrap() {
                "js" => script = f.file_name().to_str().unwrap().to_string(),
                "css" => style = f.file_name().to_str().unwrap().to_string(),
                &_ => continue,
            },
            Err(e) => {
                eprintln!("{:#?}", e);
            }
        }
        if !script.is_empty() && !style.is_empty() {
            break;
        }
    }
    (script, style)
}

#[macro_export]
macro_rules! sql_file {
    ($file:expr) => {{
        use std::io::Read;

        let mut data = String::new();
        let path = std::path::Path::new($file);
        match path.is_file() {
            true => {
                let mut file =
                    std::fs::File::open(&path).expect(&format!("Error open file ({})", $file));
                file.read_to_string(&mut data)
                    .expect(&format!("Error read file ({})", $file));
                data = data.replace("\n", "");
            }
            false => eprintln!("File '{}' not found or is a directory!", $file),
        };
        data
    }};
}
