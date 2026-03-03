// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterObjectScript",
    products: [
        .library(name: "TreeSitterObjectScript", targets: ["TreeSitterObjectScript", "TreeSitterObjectScriptUDL", "TreeSitterObjectScriptCore", "TreeSitterObjectScriptExpr"]),
    ],
    dependencies: [
    .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
  ],
    targets: [
        .target(name: "TreeSitterObjectScript",
                path: ".",
                sources: [
                    "objectscript/src/parser.c",
                    "objectscript/src/scanner.c",
                ],
                resources: [
                    .copy("udl/queries")
                ],
                publicHeadersPath: "bindings/swift/objectscript",
                cSettings: [.headerSearchPath("objectscript/src")]),
        .target(name: "TreeSitterObjectScriptUDL",
                path: ".",
                sources: [
                    "udl/src/parser.c",
                    "udl/src/scanner.c",
                ],
                resources: [
                    .copy("udl/queries")
                ],
                publicHeadersPath: "bindings/swift/objectscript_udl",
                cSettings: [.headerSearchPath("udl/src")]),
        .target(name: "TreeSitterObjectScriptCore",
                path: ".",
                sources: [
                    "core/src/parser.c",
                    "core/src/scanner.c",
                ],
                resources: [
                    .copy("core/queries")
                ],
                publicHeadersPath: "bindings/swift/objectscript_core",
                cSettings: [.headerSearchPath("core/src")]),
        .target(name: "TreeSitterObjectScriptExpr",
                path: ".",
                sources: [
                    "expr/src/parser.c",
                ],
                resources: [
                    .copy("expr/queries")
                ],
                publicHeadersPath: "bindings/swift/objectscript_expr",
                cSettings: [.headerSearchPath("expr/src")]),
        .testTarget(
            name: "TreeSitterTypeScriptTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterObjectScript",
                "TreeSitterObjectScriptUDL",
                "TreeSitterObjectScriptCore",
                "TreeSitterObjectScriptExpr",
            ],
            path: "bindings/swift/TreeSitterObjectScriptTests"
            )
    ],
    cLanguageStandard: .c11
)
