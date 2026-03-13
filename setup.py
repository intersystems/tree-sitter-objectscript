from os.path import isdir, join
from platform import system

from setuptools import Extension, find_packages, setup
from setuptools.command.build import build
from wheel.bdist_wheel import bdist_wheel


class Build(build):
    def run(self):
        copies = [
            ("udl/queries",  join(self.build_lib, "tree_sitter_objectscript",        "queries")),
            ("udl/queries",  join(self.build_lib, "tree_sitter_objectscript_udl",    "queries")),
        ]
        for src, dest in copies:
            if isdir(src):
                self.copy_tree(src, dest)
        super().run()


class BdistWheel(bdist_wheel):
    def get_tag(self):
        python, abi, platform = super().get_tag()
        if python.startswith("cp"):
            python, abi = "cp38", "abi3"
        return python, abi, platform


setup(
    packages=find_packages(
        "bindings/python",
        include=[
            "tree_sitter_objectscript",
            "tree_sitter_objectscript.queries",
            "tree_sitter_objectscript_udl",
            "tree_sitter_objectscript_udl.queries",
        ],
    ),
    package_dir={"": "bindings/python"},
    package_data={
        "tree_sitter_objectscript": ["*.pyi", "py.typed"],
        "tree_sitter_objectscript.queries": ["*.scm"],
        "tree_sitter_objectscript_udl": ["*.pyi", "py.typed"],
        "tree_sitter_objectscript_udl.queries": ["*.scm"],
    },
    ext_modules=[
        Extension(
            name="tree_sitter_objectscript._binding",
            sources=[
                "bindings/python/tree_sitter_objectscript/binding.c",
                "objectscript/src/parser.c",
                "objectscript/src/scanner.c",
            ],
            extra_compile_args=[
                "-std=c11",
            ] if system() != "Windows" else [
                "/std:c11",
                "/utf-8",
            ],
            define_macros=[
                ("Py_LIMITED_API", "0x03080000"),
                ("PY_SSIZE_T_CLEAN", None)
            ],
            include_dirs=["objectscript/src", "common"],
            py_limited_api=True,
        ),
        Extension(
            name="tree_sitter_objectscript_udl._binding",
            sources=[
                "bindings/python/tree_sitter_objectscript_udl/binding.c",
                "udl/src/parser.c",
                "udl/src/scanner.c",
            ],
            extra_compile_args=[
                "-std=c11",
            ] if system() != "Windows" else [
                "/std:c11",
                "/utf-8",
            ],
            define_macros=[
                ("Py_LIMITED_API", "0x03080000"),
                ("PY_SSIZE_T_CLEAN", None)
            ],
            include_dirs=["udl/src", "common"],
            py_limited_api=True,
        ),
    ],
    cmdclass={
        "build": Build,
        "bdist_wheel": BdistWheel
    },
    zip_safe=False
)
