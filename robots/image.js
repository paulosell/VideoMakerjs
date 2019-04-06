const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')
const googleSearchCredentials = require('../credentials/google.json')
async function robot(){
    const content = state.load()
    await fetchImagesOfAllSentences(content)
    state.save(content)
    

    async function fetchImagesOfAllSentences(conten){
        for (const sentence of content.sentences){
            const query = `${content.searchTerm} ${sentence.keywords[0]}`
            sentence.images =  await fetchGoogleAndReturnImagesLinks(query) 
            sentence.googleSearchQuery = query
        }
    }
    
    async function fetchGoogleAndReturnImagesLinks(query){
    
        const response = await customSearch.cse.list({
        auth: googleSearchCredentials.apiKey,
        cx: googleSearchCredentials.searchEngineId,
        q:  query,
        searchType: 'image',
        imgSize: 'huge',
        num: 2
    })
        const imagesURL = response.data.items.map((item) =>{
            return item.link
        })
        return imagesURL
    }
    
}

module.exports = robot