// Dependências
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');
const { Client, Buttons, List, MessageMedia, LocalAuth } = require('whatsapp-web.js');

// 🔹 Mini servidor keep-alive (para o Render não hibernar)
const app = express();
app.get('/', (req, res) => res.send('Bot ativo!'));
app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(process.env.PORT || 3000, () => {
    console.log('🌐 Servidor keep-alive rodando...');
});

// 🔹 Inicializa cliente com sessão salva e flags para servidor/headless
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

const delay = ms => new Promise(res => setTimeout(res, ms));

// Controle de etapa por usuário
const userStage = {}; // { "numero@c.us": "etapa1", ... }

// Lista de números bloqueados
const blockedNumbers = [
    '5511913382824@c.us',
    '5511913642189@c.us',
    '5511943263585@c.us'
];

// Função para enviar com digitação simulada
async function sendWithTyping(chat, message, delayTime = 3000) {
    await delay(delayTime);
    await chat.sendStateTyping();
    await delay(delayTime);
    await chat.sendMessage(message);
}

// Conexão do WhatsApp
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📲 Escaneie o QR Code acima para conectar.');
});

client.on('ready', () => {
    console.log('✅ Tudo certo! WhatsApp conectado.');
});

client.initialize();

client.on('message', async msg => {
    const from = msg.from;
    const body = msg.body?.trim();
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const firstName = contact.pushname?.split(" ")[0] || "";

    // 🔹 Bloqueia mensagens de números específicos
    if (blockedNumbers.includes(from)) {
        return; // Ignora totalmente a mensagem
    }

    // 🔹 Sempre permitir voltar ao menu, independentemente da etapa
    if (/(menu|Menu|voltar|retornar|inicio|início|oii)/i.test(body) && from.endsWith('@c.us')) {
        await sendWithTyping(chat, `Olá ${firstName}! Eu sou a assistente virtual da Safe Capital Garantia Locatícia e estou aqui para te ajudar!💙\n\nEscolha uma das opções abaixo:\n\n1 - Quero adquirir a garantia da Safe Capital 🔐\n2 - Tenho dúvidas quanto a garantia contratada 🤔\n3 - Quero falar com o setor Financeiro 💰\n4 - Quero falar sobre outros assuntos 💬`);
        userStage[from] = "menu";
        return; // Impede de continuar para outras lógicas
    }

    // 🔹 ETAPA 0 - Primeiro contato
    if (!userStage[from]) {
        if (/(dia|tarde|noite|oi|Olá|ola)/i.test(body) && from.endsWith('@c.us')) {
            await sendWithTyping(chat, `Olá ${firstName}! Eu sou a assistente virtual da Safe Capital Garantia Locatícia e estou aqui para te ajudar!💙\n\nEscolha uma das opções abaixo:\n\n1 - Quero adquirir a garantia da Safe Capital 🔐\n2 - Tenho dúvidas quanto a garantia contratada 🤔\n3 - Quero falar com o setor Financeiro 💰\n4 - Quero falar sobre outros assuntos 💬`);
            userStage[from] = "menu";
            return;
        }
    }

    // 🔹 MENU PRINCIPAL
    if (userStage[from] === "menu") {
        if (body === '1') {
            await sendWithTyping(chat, 'Agradecemos pelo seu interesse em firmar uma parceria com a SAFE CAPITAL. ☺️💙\n\nPor favor, me informe:\n\n*Nome da sua imobiliária:*\n*Seu nome:*\n*Whatsapp para contato (caso seja outro):*\n\n_Digite *"voltar"* para retornar ao menu das opções, caso tenha clicado no número errado._');
            await sendWithTyping(chat, 'Link para ser um parceiro: https://www.safecapitalgarantias.com.br/');
            userStage[from] = "parceria";
            return;
        }
        if (body === '2') {
            await sendWithTyping(chat, 'Perfeito! Estamos aqui para te ajudar com suas dúvidas sobre a Garantia SAFE CAPITAL. Por favor, selecione uma das opções abaixo:\n\n*8 - Já sou parceiro SAFE*\n*9 - Não sou parceiro SAFE*\n\n_Digite *"voltar"* para retornar ao menu das opções, caso tenha clicado no número errado._');
            userStage[from] = "duvida";
            await sendWithTyping(chat, "Por favor, selecione uma das opções de 8 a 9.");
            return;
        }
        if (body === '3') {
            await sendWithTyping(chat, 'Você foi direcionado(a) para o setor financeiro da SAFE CAPITAL. Para que possamos te atender da melhor forma, selecione uma das opções abaixo:.\n\n*6 - Já sou parceiro SAFE*\n*7 - Não sou parceiro SAFE*\n\n_Digite *"voltar"* para retornar ao menu das opções, caso tenha clicado no número errado._');
            userStage[from] = "financeiro";
             await sendWithTyping(chat, "Por favor, selecione uma das opções de 6 a 7.");
            return;
        }

        if (body === '4') {
            await sendWithTyping(chat, 'Entendido! Para te direcionarmos da melhor forma, por favor, informe abaixo o tipo de assunto que deseja tratar\n\nCaso seja cliente, pode adiantar seu atendimento informando seu nome e número de contrato que deseja falar:\n\n_Digite *"voltar"* para retornar ao menu das opções, caso tenha clicado no número errado._');
            userStage[from] = "outros";
            return;
        }
        await sendWithTyping(chat, "Por favor, selecione uma das opções de 1 a 4.");
    }

    // 🔹 ETAPAS ESPECÍFICAS
    if (userStage[from] === "parceria") {
        await sendWithTyping(chat, "Obrigado pelas informações! Um consultor entrará em contato em breve.");
        userStage[from] = null;
        return;
    }

    if (userStage[from] === "duvida") {
        if (body === '8') {
            await sendWithTyping(chat, 'Parceiro SAFE ✅\nPara ajudarmos da melhor forma possivél poderia me informar:\n\n*Seu nome:*\n*Nº da garantia que deseja falar:*\n*Nome da imobiliária:*\n*Sua dúvida:*\n\n_Em breve um atendente irá te ajudar! Lembrando que as respostas ocorrem de acordo com a ordem de chegada._');
        } else if (body === '9') {
            await sendWithTyping(chat, 'Sem problemas! Para ajudarmos da melhor forma, nos informe:\n\n*Seu nome:*\n*Nº da garantia que deseja falar:*\n*Nome da imobiliária:*\n*Sua dúvida*\n\n_Em breve um atendente irá te ajudar! Lembrando que as respostas ocorrem de acordo com a ordem de chegada._');
        }
    }

    if (userStage[from] === "financeiro") {
        if (body === '6') {
            await sendWithTyping(chat, "Que bom! Para ajudarmos da melhor forma possivél poderia me informar:\n\n*Seu nome:*\n*Nº da garantia que deseja falar:*\n*Nome da imobiliária:*\n*Assunto que deseja falar com financeiro:*\n\n_Em breve um atendente irá te ajudar! Lembrando que as respostas ocorrem de acordo com a ordem de chegada._");
        } else if (body === '7') {
            await sendWithTyping(chat, "Sem problemas! Para atendimento financeiro de não parceiros, nos informe:\n\n*Seu nome:*\n*Assunto que deseja tratar com o financeiro:*\n\n_Em breve um atendente irá te ajudar! Lembrando que as respostas ocorrem de acordo com a ordem de chegada._");
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
