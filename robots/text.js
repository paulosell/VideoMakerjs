const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')
const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
const state = require('./state.js')
const nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'

})




async function robot(){
    const content = state.load()
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSenteces(content)
    limitMaximumSentences(content)
    await fetchKeywordsOfAllSentences(content)
    state.save(content)
    
    async function fetchContentFromWikipedia(content) {
        const algorithmiaAutenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAutenticated.algo("web/WikipediaParser/0.1.2")
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()

        content.sourceContentOriginal =  wikipediaContent.content
    }
    
    function sanitizeContent(content){
       const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
       const withoutDatesInParenthesis = removeDatesInParenthesis(withoutBlankLinesAndMarkdown)
       content.sourceContentSanitized = withoutDatesInParenthesis 

       function removeBlankLinesAndMarkdown(text){
           const allLines= text.split('\n')
           const withoutBlankLinesAndMarkdown = allLines.filter((line) =>{
               if (line.trim().length === 0 || line.trim().startsWith('=')){
                   return false
               }return true
           })
           return withoutBlankLinesAndMarkdown.join(' ')
       }
       
       function removeDatesInParenthesis(text){
           return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')  
       }      
    }

    function breakContentIntoSenteces(content){
        content.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) =>{
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }

    function limitMaximumSentences(content){
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function fetchKeywordsOfAllSentences(content) {
        for (const sentence of content.sentences) {
          sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
        }
      }
    

    async function fetchWatsonAndReturnKeywords(sentence){
        return new Promise ((resolve, reject) => {
            nlu.analyze(
                {
                  text: sentence,
                  features: {
                    keywords: {}
                }
                }, (err, response)=> {
                  if (err) {
                    console.log('error:', err)
                } 
                   const keywords = response.keywords.map((keyword)=>{
                   return keyword.text })
                   resolve(keywords)
                
            })
    
    
        })
    
    
    }
}

module.exports = robot