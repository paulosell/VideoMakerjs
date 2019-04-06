const readline = require('readline-sync')
function start(){
    const content = {}

    content.seachTerm = askAndReturnSearchTerm()
    content.prefix = askAndReturnPrefix()
    function askAndReturnSearchTerm(){
        return readline.question('Digite o termo de busca do Wikipedia: ')
        
    }

    function askAndReturnPrefix(){
        const prefixes  = ['Who is', 'What is', 'The history of']
        const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
        const selectedPrefixText = prefixes[selectedPrefixIndex]

        return selectedPrefixText
        
         
    }
    console.log(content)
}


start()