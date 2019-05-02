const state = require('../state')
const sourceBoundaryDetection = require('sbd')
const algorithmia = require('algorithmia');
const pass = require('../credentials/algorithmia.json').algo
const password = require('../credentials/watson.json').apikey
const url = require('../credentials/watson.json').url
const nluv1 = require('ibm-watson/natural-language-understanding/v1')

async function robot(){
    content = state.load()
    await fetchContentFromWikipedia(content)
    state.save(content)
    content = state.load()
    sanitizeContent(content)
    state.save(content)
    content = state.load()
    breakIntoSentences(content)
    state.save(content)
    content = state.load()
    limitMaximumSentences(content)
    state.save(content)
    content = state.load()
    await fetchKeywordsFromAllSentences(content)
    state.save(content)
}

async function fetchContentFromWikipedia(content){
    const AlgoAuthenticated = await algorithmia(pass)
    const wikipediaAlgorithm = await AlgoAuthenticated.algo('web/WikipediaParser/0.1.2?timeout=300')
    const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
    const wikipediaContent = await wikipediaResponse.get()
    content.sourceContentOriginal = wikipediaContent.content
}

function sanitizeContent(content){
    withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
    content.sourceContentSanitized = withoutBlankLinesAndMarkdown
}

function removeBlankLinesAndMarkdown(text){
    const allLines = text.split('\n')
    const withoutBlankLinesAndMarkdown = allLines.filter((line) =>{
        if (line.trim().length === 0 || line.trim().startsWith('=')){
            return false
        }
        return true
    })
    return withoutBlankLinesAndMarkdown.join(' ')
}

function breakIntoSentences(content){
    content.sentences = []
    const sentences = sourceBoundaryDetection.sentences(content.sourceContentSanitized)
    sentences.forEach((sentence) =>{
        content.sentences.push({
            text: sentence,
            keywords: [],
            images: []
        })
    })
    
}

async function fetchKeywordsFromAllSentences(content){
    for(const sentences of content.sentences){
        sentences.keywords = await fetchKeywordsFromWatson(sentences.text)
    }
}

async function fetchKeywordsFromWatson(sentences){
    try{
        const nlu = new nluv1({
            iam_apikey: password,
            version: '2019-02-01',
            url: url
        })
        promise = new Promise((resolve, reject) =>{
            nlu.analyze({
                text: sentences,
                features:{
                    keywords:{}
            },
        }, (err, res) => {
                    if (err) {
                        throw err
                    }
                    const keywords = res.keywords.map((keyword) =>{
                        return keyword.text})
                    resolve(keywords)
                })
            })
            return await promise
    }
    catch(e){
        console.log(e)
    }
}
    
    function limitMaximumSentences(content){
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }
    
module.exports = robot