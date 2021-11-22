# API Generation

## Commands

### prepare-workspace

This command prepare files. They use all `.tmpl` files to generate real one.

`npm run prepare-workspace -- --apiName=${apiName} --apiVersion=${apiVersion} --apiFile=${apiFile} --registry=${registry}`

Variables example:
* ***apiName***="pet-store-api"
* ***apiVersion***=1.0.5
* ***apiFile***="../contracts/pet-store.yaml"
* ***registry***="http://gestafor-nexus.afeliodev.local/repository/npm-private"

### package

This command generate models and services from apiFile and build it into a publishable package.

`npm run package`

### publish

Publish to your npm repository.

`npm login --registry=${registry}``
`npm publish --registry=${registry}``

Variables example:
* ***registry***="http://gestafor-nexus.afeliodev.local/repository/npm-private"
