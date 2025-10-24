// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterObjectscript",
    products: [
        .library(name: "TreeSitterObjectscript", targets: ["TreeSitterObjectscript"]),
    ],
    dependencies: [
    .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
  ],
    targets: [
        .target(name: "TreeSitterObjectscript",
                path: ".",
                sources: [
                    "udl/src/parser.c",
                    "udl/src/scanner.c",
                ],
                resources: [
                    .copy("udl/queries")
                ],
                publicHeadersPath: "bindings/swift/objectscript",
                cSettings: [.headerSearchPath("udl/src")]),
        .testTarget(
            name: "TreeSitterTypeScriptTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterObjectscript",
            ],
            path: "bindings/swift/TreeSitterObjectScriptTests"
            )
    ],
    cLanguageStandard: .c11
)
