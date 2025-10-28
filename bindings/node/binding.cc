#include <napi.h>

typedef struct TSLanguage TSLanguage;

extern "C" TSLanguage *tree_sitter_objectscript();
extern "C" TSLanguage *tree_sitter_objectscript_core();
extern "C" TSLanguage *tree_sitter_objectscript_expr();

// "tree-sitter", "language" hashed with BLAKE2
const napi_type_tag LANGUAGE_TYPE_TAG = {
    0x8AF2E5212AD58ABF, 0xD5006CAD83ABBA16
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    auto objectscript = Napi::Object::New(env);
    objectscript["name"] = Napi::String::New(env, "objectscript");
    auto objectscript_language = Napi::External<TSLanguage>::New(env, tree_sitter_objectscript());
    objectscript_language.TypeTag(&LANGUAGE_TYPE_TAG);
    objectscript["language"] = objectscript_language;

    auto objectscript_core = Napi::Object::New(env);
    objectscript_core["name"] = Napi::String::New(env, "objectscript_core");
    auto objectscript_core_language = Napi::External<TSLanguage>::New(env, tree_sitter_objectscript_core());
    objectscript_core_language.TypeTag(&LANGUAGE_TYPE_TAG);
    objectscript_core["language"] = objectscript_core_language;

    auto objectscript_expr = Napi::Object::New(env);
    objectscript_expr["name"] = Napi::String::New(env, "objectscript_expr");
    auto objectscript_expr_language = Napi::External<TSLanguage>::New(env, tree_sitter_objectscript_expr());
    objectscript_expr_language.TypeTag(&LANGUAGE_TYPE_TAG);
    objectscript_expr["language"] = objectscript_expr_language;

    exports["objectscript"] = objectscript;
    exports["objectscript_core"] = objectscript_core;
    exports["objectscript_expr"] = objectscript_expr;
    return exports;
}

NODE_API_MODULE(tree_sitter_objectscript_binding, Init)
