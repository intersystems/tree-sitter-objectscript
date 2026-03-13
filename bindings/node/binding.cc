#include <napi.h>

typedef struct TSLanguage TSLanguage;

extern "C" TSLanguage *tree_sitter_objectscript();
extern "C" TSLanguage *tree_sitter_objectscript_udl();

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

    auto objectscript_udl = Napi::Object::New(env);
    objectscript_udl["name"] = Napi::String::New(env, "objectscript_udl");
    auto objectscript_udl_language = Napi::External<TSLanguage>::New(env, tree_sitter_objectscript_udl());
    objectscript_udl_language.TypeTag(&LANGUAGE_TYPE_TAG);
    objectscript_udl["language"] = objectscript_udl_language;

    exports["objectscript"] = objectscript;
    exports["objectscript_udl"] = objectscript_udl;
    return exports;
}

NODE_API_MODULE(tree_sitter_objectscript_binding, Init)
