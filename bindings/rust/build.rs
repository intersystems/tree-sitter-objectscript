use std::path::Path;

fn main() {
    let root_dir = Path::new(".");
    let obj_script_dir = root_dir.join("objectscript").join("src");
    let obj_udl_dir = root_dir.join("udl").join("src");
    let obj_core_dir = root_dir.join("core").join("src");
    let obj_expr_dir = root_dir.join("expr").join("src");
    let common_dir = root_dir.join("common");
    let mut config = cc::Build::new();

    config.include(&obj_script_dir);
    config.include(&obj_udl_dir);
    config.include(&obj_core_dir);
    config.include(&obj_expr_dir);

    for path in &[
        obj_script_dir.join("parser.c"),
        obj_script_dir.join("scanner.c"),
        obj_udl_dir.join("parser.c"),
        obj_udl_dir.join("scanner.c"),
    ] {
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
