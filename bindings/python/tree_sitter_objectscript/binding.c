#include <Python.h>

typedef struct TSLanguage TSLanguage;

TSLanguage *tree_sitter_objectscript(void);

static PyObject* _binding_language_objectscript(PyObject *self, PyObject *args) {
    return PyCapsule_New(tree_sitter_objectscript(), "tree_sitter.Language", NULL);
}

static PyMethodDef methods[] = {
    {"language_objectscript", _binding_language_objectscript, METH_NOARGS,
     "Get the tree-sitter language for this grammar."},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef module = {
    .m_base = PyModuleDef_HEAD_INIT,
    .m_name = "_binding",
    .m_doc = NULL,
    .m_size = -1,
    .m_methods = methods
};

PyMODINIT_FUNC PyInit__binding(void) {
    return PyModule_Create(&module);
}
