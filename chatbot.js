
// Dependências
const QRCode = require('qrcode'); // <- novo
app.get('/qr', async (req, res) => {
  if (!lastQR) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
          <div>
            <h2>Sem QR no momento</h2>
            <p>Se o bot já conectou, não há QR para mostrar.</p>
            <p><a href="/">Voltar</a></p>
          </div>
        </body>
      </html>
    `);
  }
  try {
    const dataUrl = await QRCode.toDataURL(lastQR, { width: 300, margin: 1 });
    res.send(`
      <html>
        <body style="display:flex; align-items:center; justify-content:center; height:100vh; background:#f7f7f7; font-family:sans-serif;">
          <div style="text-align:center">
            <h2>Escaneie o QR Code</h2>
            <img src="${dataUrl}" alt="QR Code" />
            <p style="color:#666">A página recarrega a cada 5s enquanto o QR for atualizado.</p>
            <script>setTimeout(()=>location.reload(), 5000)</script>
          </div>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send('Erro ao gerar o QR.');
  }
});
client.on('qr', qr => {
  lastQR = qr;                         // salva o QR para a rota /qr
  console.log('QR atualizado. Abra /qr para escanear.');
  // opcional: se quiser continuar mostrando no terminal também:
  // qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  lastQR = null;                       // limpa quando conectar
  console.log('✅ Tudo certo! WhatsApp conectado.');
});


const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js');

const client = new Client();
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
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
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
    
    //Guarde o último QR e crie a rota web:
  let lastQR = null;

  app.get('/qr', async (req, res) => {
  if (!lastQR) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
          <div>
            <h2>Sem QR no momento</h2>
            <p>Se o bot já conectou, não há QR para mostrar.</p>
            <p><a href="/">Voltar</a></p>
          </div>
        </body>
      </html>
    `);
  }
  try {
    const dataUrl = await QRCode.toDataURL(lastQR, { width: 300, margin: 1 });
    res.send(`
      <html>
        <body style="display:flex; align-items:center; justify-content:center; height:100vh; background:#f7f7f7; font-family:sans-serif;">
          <div style="text-align:center">
            <h2>Escaneie o QR Code</h2>
            <img src="${dataUrl}" alt="QR Code" />
            <p style="color:#666">A página recarrega a cada 5s enquanto o QR for atualizado.</p>
            <script>setTimeout(()=>location.reload(), 5000)</script>
          </div>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send('Erro ao gerar o QR.');
  }
});

    const express = require('express');
    const app = express();

    app.get('/', (req, res) => res.send('Bot está rodando!'));
    app.listen(3000, () => console.log('Servidor web ativo na porta 3000'));

});

