// Dependências
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const delay = ms => new Promise(res => setTimeout(res, ms));

// Controle de etapa por usuário
const userStage = {}; // { "numero@c.us": "etapa1", ... }

// Função para enviar com digitação simulada
async function sendWithTyping(chat, message, delayTime = 1500) {
    await chat.sendStateTyping();
    await delay(delayTime);
    await chat.sendMessage(message);
}

// Conexão do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] } // necessário para rodar no Render
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

// Lista de números bloqueados
const blockedNumbers = [
    "5511943263585@c.us" // Número que não deve receber mensagens
];

// Antes de qualquer processamento
client.on('message', async msg => {
    const from = msg.from;
    if (blockedNumbers.includes(from)) {
        console.log(`Mensagem ignorada de: ${from}`);
        return;
    }
});

// Funil principal
client.on('message', async msg => {
    const from = msg.from;
    const body = msg.body?.trim();
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const firstName = contact.pushname?.split(" ")[0] || "";

    // Voltar ao menu
    if (/(menu|Menu|voltar|retornar|inicio|início)/i.test(body) && from.endsWith('@c.us')) {
        await sendWithTyping(chat, `Olá ${firstName}! Eu sou a assistente virtual da Safe Capital Garantia Locatícia e estou aqui para te ajudar!💙\n\nEscolha uma das opções abaixo:\n\n1 - Quero adquirir o Seguro Fiança da Safe Capital 🔐\n2 - Tenho dúvidas quanto a garantia contratada 🤔\n3 - Quero falar com o setor Financeiro 💰\n4 - Quero falar sobre outros assuntos 💬`);
        userStage[from] = "menu";
        return;
    }

    // Etapa 0 - Primeiro contato
    if (!userStage[from]) {
        if (/(dia|tarde|noite|oi|Olá|ola)/i.test(body) && from.endsWith('@c.us')) {
            await sendWithTyping(chat, `Olá ${firstName}! Eu sou a assistente virtual da Safe Capital Garantia Locatícia e estou aqui para te ajudar!💙\n\nEscolha uma das opções abaixo:\n\n1 - Quero adquirir o Seguro Fiança da Safe Capital 🔐\n2 - Tenho dúvidas quanto a garantia contratada 🤔\n3 - Quero falar com o setor Financeiro 💰\n4 - Quero falar sobre outros assuntos 💬`);
            userStage[from] = "menu";
            return;
        }
    }

    // Menu principal
    if (userStage[from] === "menu") {
        if (body === '1') {
            await sendWithTyping(chat, 'Agradecemos pelo seu interesse em firmar uma parceria com a SAFE CAPITAL. ☺️💙\n\nPor favor, me informe:\n\n*Nome da sua imobiliária:*\n*Seu nome:*\n*Whatsapp para contato (caso seja outro):*\n\n_Digite *\"voltar\"* para retornar ao menu das opções, caso tenha clicado no número errado._');
            await sendWithTyping(chat, 'Link para ser um parceiro: https://www.safecapitalgarantias.com.br/');
            userStage[from] = "parceria";
            return;
        }
        if (body === '2') {
            await sendWithTyping(chat, 'Perfeito! Estamos aqui para te ajudar com suas dúvidas sobre a Garantia SAFE CAPITAL. Por favor, selecione uma das opções abaixo:\n\n*8 - Já sou parceiro SAFE*\n*9 - Não sou parceiro SAFE*\n\n_Digite *\"voltar\"* para retornar ao menu das opções, caso tenha clicado no número errado._');
            userStage[from] = "duvida";
            return;
        }
        if (body === '3') {
            await sendWithTyping(chat, 'Você foi direcionado(a) para o setor financeiro da SAFE CAPITAL. Para que possamos te atender da melhor forma, selecione uma das opções abaixo:.\n\n*6 - Já sou parceiro SAFE*\n*7 - Não sou parceiro SAFE*\n\n_Digite *\"voltar\"* para retornar ao menu das opções, caso tenha clicado no número errado._');
            userStage[from] = "financeiro";
            return;
        }
        if (body === '4') {
            await sendWithTyping(chat, 'Entendido! Para te direcionarmos da melhor forma, por favor, informe abaixo o tipo de assunto que deseja tratar\n\nCaso seja cliente, pode adiantar seu atendimento informando seu nome e número de contrato que deseja falar:\n\n_Digite *\"voltar\"* para retornar ao menu das opções, caso tenha clicado no número errado._');
            userStage[from] = "outros";
            return;
        }
        await sendWithTyping(chat, "Por favor, selecione uma das opções de 1 a 4.");
    }

    // Etapas específicas
    if (userStage[from] === "parceria") {
        await sendWithTyping(chat, "Obrigado pelas informações! Um consultor entrará em contato em breve.");
        userStage[from] = null;
        return;
    }

    if (userStage[from] === "duvida") {
        if (body === '8') {
            await sendWithTyping(chat, 'Parceiro SAFE ✅\nPara ajudarmos da melhor forma possivél poderia me informar:\n\n' + '*Seu nome:*\n*Nº da garantia que deseja falar:*\n*Nome da imobiliária:*\n*Sua dúvida:*\n\n' + '_Em breve um atendente irá te ajudar! Lembrando que as respostas ocorrem de acordo com a ordem de chegada._');
        } else if (body === '9') {
            await sendWithTyping(chat, 'Sem problemas! Para ajudarmos da melhor forma, nos informe:\n\n' + '*Seu nome:*\n*Nº da garantia que deseja falar:*\n*Nome da imobiliária:*\n*Sua dúvida*\n\n' + '_Em breve um atendente irá te ajudar! Lembrando que as respostas ocorrem de acordo com a ordem de chegada._');
        }
    }

    if (userStage[from] === "financeiro") {
        if (body === '6') {
            await sendWithTyping(chat, "Que bom! Para ajudarmos da melhor forma possivél poderia me informar:\n\n' + '*Seu nome:*\n*Nº da garantia que deseja falar:*\n*Nome da imobiliária:*\n*Assunto que deseja falar com financeiro:*\n\n' + '_Em breve um atendente irá te ajudar! Lembrando que as respostas ocorrem de acordo com a ordem de chegada._");
        } else if (body === '7') {
            await sendWithTyping(chat, "Sem problemas! Para atendimento financeiro de não parceiros, nos informe:\n\n' + '*Seu nome:*\n*Assunto que deseja tratar com o financeiro:*\n\n' + '_Em breve um atendente irá te ajudar! Lembrando que as respostas ocorrem de acordo com a ordem de chegada._");
        }
    }

    if (userStage[from] === "atendente") {
        await sendWithTyping(chat, "Ok! Aguarde, um atendente vai assumir sua conversa.");
        userStage[from] = null;
        return;
    }

    if (userStage[from] === "outros") {
        await sendWithTyping(chat, "Entendi! Encaminhando para o setor responsável.");
        userStage[from] = null;
        return;
    }
});

client.initialize();
