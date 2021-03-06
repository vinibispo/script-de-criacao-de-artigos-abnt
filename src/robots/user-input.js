const read = require('readline-sync')
const state = require('../state')
const robot = () =>{
    let content = {term: '', amount: 0}
    if(state.load()){
        content  = state.load()
    }
console.log("[input-robot] Starting input robot")
 const askAndReturnSearchTerm = ( ) =>{
    console.log("[input-robot] Welcome to the input robot")
    const term =  read.question("What do you look for?")
    console.log(`[input-robot] Got term ${term}`)
    return term
}
const askAndReturnNumOfResults = () =>{
    const amount = read.questionInt('[input-robot] How much results do you have?')
    return amount
}
    content.term = askAndReturnSearchTerm()
    content.amount = askAndReturnNumOfResults()
    state.save(content)
}
module.exports = robot