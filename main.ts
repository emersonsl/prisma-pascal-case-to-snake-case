const fs = require('fs');

const REGEX_MODEL = "model.*\{([^\}]|\n|\r|\t)*\}";
const REGEX_ENUM = "enum.*\{([^\}]|\n|\r|\t)*\}";
const REGEX_DEF_MODEL = "model[^\{]+\{";
const REGEX_DEF_ENUM = "enum[^\{]+\{";
const REGEX_NAME = "[a-zA-Z]+";
const REGEX_WORD = "[A-Z][a-z]+";
const REGEX_LOWER_WORD = "[a-z]+";
const REGEX_ATTR_NAME = "[a-zA-Z][a-zA-Z0-9_]+";
const REGEX_ATTR_TYPE = "[A-Z][a-zA-Z]+\\s*(\\?|\\[\\])?";
const REGEX_ATTR_SUFIX = "(@[^@\\n]+\\s*)";
const REGEX_ATTR = REGEX_ATTR_NAME + "\\s+" + REGEX_ATTR_TYPE + "(" + REGEX_ATTR_SUFIX + ")*" + "\\s*\\n";
const REGEX_ITEM_ENUM = "[a-zA-Z][a-zA-Z0-9_]+\n";

const FILE_NAME = 'schema.prisma';
const ENCODING = 'utf-8';

function readFile(name, encoding) {
    return fs.readFileSync(name, encoding);
}

function writeFile(name, content){
    return fs.writeFileSync(name, content);
}

function extractModels(content) {
    return [...content.matchAll(REGEX_MODEL)];
}

function extractEnums(content) {
    return [...content.matchAll(REGEX_ENUM)];
}

function extractDefModel(model) {
    return model[0].match(REGEX_DEF_MODEL);
}

function extractDefEnum(enumeration) {
    return enumeration[0].match(REGEX_DEF_ENUM);
}

function extractNames(def) {
    return [...def[0].matchAll(REGEX_NAME)]
}

function extractWords(name) {
    const words = [...name[0].matchAll(REGEX_WORD)];
    if(words.length == 0 || words[0].index != 0){
        words.unshift(name[0].match(REGEX_LOWER_WORD) || name[0].match(REGEX_ATTR_NAME));
    }
    return words;
}

function toSnakeCase(name) {
    let nameSnakeCase = "";
    extractWords(name).forEach((word, index) => {
        index == 0 ? nameSnakeCase = word[0] : nameSnakeCase += '_' + word[0];
    });
    return nameSnakeCase.toLowerCase();
}

function getMapModel(model){
    const names = extractNames(extractDefModel(model));
    return "@@map(\"" + toSnakeCase(names[1]) + "\")";
}

function getMapEnum(enumeration){
    const names = extractNames(extractDefEnum(enumeration));
    return "@@map(\"" + toSnakeCase(names[1]) + "\")";
}

function getMapAttr(attr) {
    return "@map(\"" + toSnakeCase(attr.match(REGEX_ATTR_NAME)) + "\")";
}

function getMapItem(item) {
    return "@map(\"" + toSnakeCase(item) + "\")";
}

function getItemMapped(item){
    const map = getMapItem(item); 
    return item[0].replace("\n", " " + map + "\n");
}

function getAttrMapped(attr) {
    const map = getMapAttr(attr[0]);
    const sufix = attr[0].match(REGEX_ATTR_SUFIX);
    if(sufix){
        return attr[0].replace(sufix[0], map + " " + sufix[0]);
    }
    return attr[0].replace("\n", " " + map + "\n");
}

function getAttrsByModel(model){
    return [...model[0].matchAll(REGEX_ATTR)];
}

function getItensByEnum(enumeration){
    return [...enumeration[0].matchAll(REGEX_ITEM_ENUM)];
}

function getModelMapped(model, modelsNames) {
    const map = getMapModel(model);
    let newModel = model[0];
    const attrs = getAttrsByModel(model);
    console.log('\n MODEL: ' + model[0] +'\n\n');
    attrs.forEach((attr) => {
        if(!attrTypeOfModel(attr, modelsNames)){
            newModel = newModel.replace(attr[0], getAttrMapped(attr));
        }
    })
    return newModel.replace("}", "  " + map + "\n}");
}

function attrTypeOfModel(attr, getModelsNames){
    const result = getModelsNames.find((modelName) => 
        attr[0].match(REGEX_ATTR_NAME + "\\s+" + modelName + ".*") != null
    );
    return typeof result !== "undefined";
}

function getEnumMapped(enumeration) {
    const map = getMapEnum(enumeration);
    let newEnum = enumeration[0];
    const itens = getItensByEnum(enumeration);
    itens.forEach((item) => {
        newEnum = newEnum.replace(item[0], getItemMapped(item));
    })
    return newEnum.replace("}", "  " + map + "\n}");
}

function mapModels(content){
    const models = extractModels(content);
    let newContent = content;
    const modelsNames = getModelsNames(models);
    models.forEach((model) => {
        newContent = newContent.replace(model[0], getModelMapped(model, modelsNames));
    });
    return newContent;    
}

function getModelsNames(models){
    let names = new Array;
    models.forEach((model) => {
        names.push(extractNames(extractDefModel(model))[1][0]);
    });
    return names;
}

function mapEnums(content){
    const enums = extractEnums(content);
    let newContent = content;
    enums.forEach((enumeration) => {
        newContent = newContent.replace(enumeration[0], getEnumMapped(enumeration));
    });
    return newContent;    
}

function main(){
    let content = readFile(FILE_NAME, ENCODING);

    content = mapEnums(content);
    content = mapModels(content);
    writeFile("new." + FILE_NAME , content)
}

main();