# Gestão de Pulseiras — Guia de Instalação

Aplicação web para gestão da distribuição e venda de pulseiras do evento. Funciona em telemóvel e computador, com sincronização em tempo real entre todos os utilizadores.

---

## O que vais fazer (resumo)

1. Criar projecto Firebase (gratuito) — **5 min**
2. Copiar credenciais para o ficheiro `app.js` — **2 min**
3. Carregar ficheiros para GitHub — **3 min**
4. Activar GitHub Pages — **2 min**
5. Partilhar o link e instalar no telemóvel — **2 min**

**Total: ~15 minutos**

---

## Passo 1 — Criar projecto Firebase

O Firebase é o serviço da Google que vai guardar os teus dados na nuvem (gratuito).

1. Vai a https://console.firebase.google.com
2. Inicia sessão com a tua conta Google
3. Clica em **"Add project" / "Adicionar projecto"**
4. Dá-lhe um nome (ex: `pulseiras-evento`) e clica em continuar
5. Quando perguntar sobre Google Analytics, **desactiva** (não precisas) e cria
6. Depois de criado, no menu lateral esquerdo procura **"Build" → "Firestore Database"**
7. Clica em **"Create database"**
8. Escolhe **"Start in test mode"** (importante!) e clica em "Next"
9. Escolhe a localização **`eur3 (europe-west)`** e clica em "Enable"

✅ Base de dados criada.

### Obter as credenciais

1. No canto superior esquerdo, clica no ícone de **engrenagem ⚙️** → **"Project settings"**
2. Faz scroll para baixo até **"Your apps"**
3. Clica no ícone **`</>`** (web)
4. Dá um nome qualquer à app (ex: `pulseiras-web`) e clica em **"Register app"** — **NÃO** actives o Firebase Hosting
5. Vais ver um bloco de código com `const firebaseConfig = { ... }` — **copia esse objecto inteiro**

### ⚠️ Regras de segurança (importante!)

Por defeito, o "test mode" deixa qualquer pessoa ler e escrever durante 30 dias. Vamos pôr regras melhores:

1. No Firestore, clica no separador **"Rules"**
2. Apaga tudo o que está lá e cola isto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /eventos/{evento} {
      // Qualquer pessoa pode LER (para os colegas verem)
      allow read: if true;
      // Qualquer pessoa pode escrever (a app já tem palavra-passe)
      // Para mais segurança, poderias usar Firebase Auth no futuro
      allow write: if true;
    }
  }
}
```

3. Clica em **"Publish"**

---

## Passo 2 — Configurar o ficheiro `app.js`

1. Abre o ficheiro **`app.js`** num editor de texto (Notepad, VS Code, etc.)
2. No topo do ficheiro, encontra a secção `FIREBASE_CONFIG` e substitui pelos valores que copiaste do Firebase:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",                      // <- valor real
  authDomain: "pulseiras-evento.firebaseapp.com",
  projectId: "pulseiras-evento",
  storageBucket: "pulseiras-evento.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc"
};
```

3. Logo a seguir, muda também a palavra-passe:

```javascript
const ADMIN_PASSWORD = "a-tua-password-secreta";
```

⚠️ **Importante**: esta palavra-passe não é super-segura (qualquer pessoa que veja o código fonte vê-a). Mas para um evento entre conhecidos é suficiente. Só tu (com a password) consegues editar; os outros só vêem.

4. Guarda o ficheiro.

---

## Passo 3 — Carregar para o GitHub

1. Vai a https://github.com e cria um **novo repositório** (botão "New")
2. Dá-lhe um nome simples, ex: `pulseiras`
3. Marca **"Public"** (necessário para o GitHub Pages gratuito)
4. **NÃO** marques "Add README" — deixa vazio
5. Clica em "Create repository"
6. Na página seguinte, clica em **"uploading an existing file"**
7. Arrasta **TODOS os ficheiros** desta pasta (`index.html`, `app.js`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`) para a página
8. Clica em **"Commit changes"**

---

## Passo 4 — Activar GitHub Pages

1. No teu repositório, vai a **"Settings"** (topo direito)
2. No menu lateral esquerdo, clica em **"Pages"**
3. Em "Source", selecciona a branch **`main`** e a pasta **`/ (root)`**
4. Clica em **"Save"**
5. Espera 1-2 minutos. Volta a recarregar a página de Pages.
6. Vais ver um aviso verde: **"Your site is live at https://o-teu-username.github.io/pulseiras/"**

🎉 **Já tens o site online!** Abre o link para confirmar.

---

## Passo 5 — Instalar no telemóvel (como app)

A aplicação é uma **PWA** (Progressive Web App), por isso pode ser instalada como se fosse uma app nativa.

### iPhone (Safari)
1. Abre o link no Safari
2. Toca no botão **"Partilhar"** (quadrado com seta para cima)
3. Faz scroll para baixo e toca em **"Adicionar ao ecrã principal"**
4. Toca em "Adicionar"

### Android (Chrome)
1. Abre o link no Chrome
2. Toca nos **3 pontos** do canto superior direito
3. Toca em **"Adicionar ao ecrã principal"** ou **"Instalar aplicação"**

Pronto! Tens um ícone no ecrã principal e abre como uma app normal.

---

## Como usar

- **Modo apenas-leitura (por defeito)**: os teus colegas abrem o link e vêem tudo. Não conseguem editar.
- **Modo administrador**: clica no cadeado 🔒 no topo, introduz a tua palavra-passe, e podes editar tudo. O cadeado fica aberto 🔓.
- As alterações sincronizam-se automaticamente em todos os dispositivos em tempo real.
- O ícone à direita de "Distribuídas" tem cores:
  - 🟢 Verde = ligado ao Firebase
  - 🟠 Laranja = sem ligação

---

## Partilhar com os colegas

Envia-lhes simplesmente o link: `https://o-teu-username.github.io/pulseiras/`

Ou gera um QR code (https://www.qr-code-generator.com) e imprime para colares na sede.

---

## Resolver problemas

**"Sem ligação — verifica config"** no topo
- A configuração do Firebase está errada ou as Rules não foram publicadas.

**Não guarda nada quando edito**
- Estás em modo apenas-leitura. Clica no cadeado 🔒 e introduz a password.

**Não vejo o site no GitHub Pages**
- Espera mais 1-2 minutos (a primeira vez demora). Verifica em Settings → Pages se o status está activo.

**Quero reinstalar/atualizar a app no telemóvel**
- Desinstala o ícone do ecrã principal e volta a fazer "Adicionar ao ecrã principal".

---

## Custos

- **Firebase Firestore**: gratuito até 50.000 leituras e 20.000 escritas por dia. Para o teu caso (umas dezenas de pessoas) nunca vais chegar perto disto.
- **GitHub Pages**: gratuito sempre, sem limite.
- **Domínio**: o `o-teu-username.github.io/pulseiras` é gratuito. Se quiseres um domínio próprio (ex: `pulseiras.pt`), aí já tens custos.

---

Boa sorte com o evento! 🎉
