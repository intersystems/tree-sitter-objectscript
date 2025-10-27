// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterObjectScript",
    products: [
        .library(name: "TreeSitterObjectScript", targets: ["TreeSitterObjectScript"]),
    ],
    dependencies: [
    .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
  ],
    targets: [
        .target(name: "TreeSitterObjectScript",
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
                "TreeSitterObjectScript",
            ],
            path: "bindings/swift/TreeSitterObjectScriptTests"
            )
    ],
    cLanguageStandard: .c11
)
