use std::path::Path;

fn main() {
    let root_dir = Path::new(".");
    let obj_udl_dir = root_dir.join("udl").join("src");
    let routine_dir = root_dir.join("objectscript_routine").join("src");
    let common_dir = root_dir.join("common");
    let mut config = cc::Build::new();

    config.include(&obj_udl_dir);

    for path in &[obj_udl_dir.join("parser.c"), obj_udl_dir.join("scanner.c"), routine_dir.join("parser.c"), routine_dir.join("scanner.c")] {
        config.file(path);
        println!("cargo:rerun-if-changed={}", path.to_str().unwrap());
    }

    println!(
        "cargo:rerun-if-changed={}",
        common_dir.join("scanner.h").to_str().unwrap()
    );

    // MSVC quirk
    if cfg!(target_env = "msvc") {
        config.define("TREE_SITTER_DISABLE_ATOMIC", None);
    }

    config.compile("tree-sitter-objectscript");
}
