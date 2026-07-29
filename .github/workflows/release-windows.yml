name: Windows Release Yayınla

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  release-windows:
    runs-on: windows-latest
    timeout-minutes: 30

    steps:
      - name: Kaynak kodu al
        uses: actions/checkout@v4

      - name: Node.js hazırla
        uses: actions/setup-node@v4
        with:
          node-version: "24"

      - name: Bağımlılıkları GitHub sunucusunda kur
        shell: pwsh
        run: npm install --no-audit --no-fund

      - name: EXE üret ve GitHub Release'e yükle
        shell: pwsh
        run: npm run release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_IDENTITY_AUTO_DISCOVERY: "false"
