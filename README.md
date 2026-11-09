# 🐞 BugBox

Aplicativo mobile para **registrar bugs encontrados durante testes de software**, desenvolvido em **React Native + Expo + TypeScript**, com **login via Firebase Authentication** e **dados no Cloud Firestore**.

**Aluno:** Felipe Ribeiro Salles de Camargo — RM 565224
**Disciplina:** Mobile Application Development — CheckPoint 3 (individual)
**Professor:** Pietro Rischi Nunes

---

## 1. Definição do app

### O problema
Durante uma sessão de testes, o testador encontra vários bugs e costuma anotar tudo em papel, bloco de notas ou mensagens soltas. Depois fica difícil saber o que ainda está aberto, o que já foi corrigido e o que é mais grave.

### A proposta
O **BugBox** é um caderno de bugs no celular. O usuário cria uma conta, registra cada bug com título, passos para reproduzir e severidade, e acompanha o que está **aberto** ou **resolvido**. Os dados ficam salvos no Firestore, vinculados à conta do usuário, e aparecem de novo em qualquer aparelho em que ele fizer login.

### Funcionalidades

**Login (Firebase Authentication)**
- Entrar com e-mail e senha
- Criar conta com nome, e-mail, senha e confirmação de senha
- Mostrar/esconder a senha
- Recuperar a senha por e-mail
- Sessão salva: ao reabrir o app, o usuário continua logado
- Sair da conta (com confirmação)

**Bugs (Cloud Firestore)**
- Registrar bug com título, descrição ("como reproduzir") e severidade (Baixa, Média, Alta ou Crítica)
- Lista em tempo real, do mais novo para o mais antigo
- Tocar no bug alterna entre **aberto** e **resolvido**
- Excluir bug (segurando o card ou pelo ícone de lixeira), com confirmação
- Filtros: Todos, Abertos e Resolvidos
- Resumo com a quantidade de bugs abertos e resolvidos
- Saudação com o nome salvo no perfil

### Telas e fluxo

| Tela | O que faz |
|---|---|
| **Login** | Entrar, cadastrar e recuperar senha |
| **Bugs** | Lista, filtros, resumo, marcar como resolvido, excluir e sair |
| **Registrar bug** | Formulário de novo bug |

```text
Abre o app ──► Sessão salva? ── sim ──► Bugs
                     │
                    não
                     ▼
                   Login ──► Entrar / Criar conta / Recuperar senha
                     │
                  sucesso
                     ▼
                   Bugs ──► + ──► Registrar bug ──► Firestore ──► lista atualizada sozinha
                     │
                   Sair ──► volta para o Login
```

### Tecnologias

| Tecnologia | Uso no BugBox |
|---|---|
| React Native + Expo | Interface mobile e execução no Expo Go |
| TypeScript | Tipos dos dados, das rotas e das props |
| React Navigation (Native Stack) | Navegação entre Login, Bugs e Registrar bug |
| Firebase Authentication | Cadastro, login, sessão, recuperação de senha e logout |
| Cloud Firestore | Perfil do usuário e bugs |
| AsyncStorage | Guarda a sessão do Auth no aparelho |
| @expo/vector-icons | Ícones (Ionicons) |

### Estrutura do projeto

```text
CP3-BugBox/
├── App.tsx                     # escuta a sessão e escolhe as telas do Stack
├── index.ts                    # registra o App como componente raiz
├── firestore.rules             # regras de segurança do Firestore
└── src/
    ├── firebase.ts             # inicializa Firebase, Auth (com persistência) e Firestore
    ├── theme.ts                # cores e severidades
    ├── dialog.ts               # mensagens e confirmações (Alert no celular, alert/confirm no navegador)
    ├── context/UserContext.ts  # compartilha o usuário logado com as telas
    ├── navigation/types.ts     # tipos das rotas
    ├── services/
    │   ├── auth.ts             # login, cadastro, reset, logout, perfil e mensagens de erro
    │   └── bugs.ts             # tipos e operações dos bugs no Firestore
    ├── screens/
    │   ├── LoginScreen.tsx
    │   ├── BugListScreen.tsx
    │   └── NewBugScreen.tsx
    └── types/firebase-auth.d.ts  # tipagem do getReactNativePersistence
```

### Como executar

1. O app já está ligado ao projeto Firebase `bugbox-2612a` (configuração em `src/firebase.ts`). Para usar outro projeto, crie um no [Firebase Console](https://console.firebase.google.com/):
   - **Authentication** → ative o provedor **E-mail/senha**
   - **Firestore Database** → crie o banco
   - **Firestore → Regras** → cole o conteúdo de `firestore.rules` e publique
   - **Configurações do projeto → Seus apps → Web** → copie o `firebaseConfig`
2. Cole o `firebaseConfig` em `src/firebase.ts`.
3. Rode:

```bash
npm install
npx expo install react-dom react-native-web
```

4. Escolha onde abrir:
   - **No navegador:** `npx expo start --web` (abre o app no Chrome, sem precisar de celular)
   - **No celular:** `npx expo start` e escaneie o QR Code com o **Expo Go** (no iPhone, entre com a mesma conta Expo no computador, via `npx expo login`, e no Expo Go)

---

## 3. Conceitos utilizados

### 3.1 Login com Firebase Authentication
O Authentication cuida de **quem é o usuário**. As funções ficam em `src/services/auth.ts`:

| Função do Firebase | Onde | Para que serve |
|---|---|---|
| `signInWithEmailAndPassword` | `login()` | Entrar em uma conta existente |
| `createUserWithEmailAndPassword` | `register()` | Criar a conta |
| `updateProfile` | `register()` | Salvar o nome no perfil do Auth |
| `sendPasswordResetEmail` | `resetPassword()` | Enviar o e-mail de recuperação |
| `signOut` | `logout()` | Encerrar a sessão |
| `onAuthStateChanged` | `App.tsx` | Avisar quando alguém entra ou sai |

No cadastro, além de criar a conta, o app grava o perfil em `users/{uid}` no Firestore com `setDoc`. A senha vai apenas para o Firebase Authentication; o app não grava senha no banco.

### 3.2 Sessão persistida (restore da sessão)
Em `src/firebase.ts`, no celular o Auth é inicializado com `initializeAuth` e `getReactNativePersistence(AsyncStorage)`; no navegador (`Platform.OS === "web"`) usa `getAuth`, que guarda a sessão no armazenamento do próprio browser. A sessão fica salva no aparelho e é restaurada quando o app abre de novo, sem novo login. Se o Auth já estiver inicializado (acontece quando o Expo recarrega), o código trata o erro `auth/already-initialized` e reaproveita a instância com `getAuth`.

### 3.3 Navegação condicional
O `App.tsx` escuta a sessão:

```tsx
useEffect(() => {
  return onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setCheckingSession(false);
  });
}, []);
```

- Enquanto a sessão é verificada, aparece um `ActivityIndicator`.
- Se existe `user`, o Stack registra as telas **Bugs** e **Registrar bug**; se não existe, registra só **Login**.
- Por isso o app **não chama `navigate()` depois do login**: quando o estado `user` muda, as telas disponíveis mudam. No logout, `onAuthStateChanged` recebe `null` e o Login volta.
- Entre Bugs e Registrar bug, a navegação é feita com `navigation.navigate("NewBug")` e `navigation.goBack()`.
- `RootStackParamList` (em `navigation/types.ts`) tipa as rotas.

### 3.4 Context API
O usuário logado é compartilhado com `UserContext`. As telas chamam `useUser()` e recebem o `User` do Firebase sem precisar passar props entre telas.

### 3.5 Cloud Firestore: modelo dos dados
O Firestore é um banco **NoSQL** de **coleções e documentos**. O `uid` vindo do Authentication monta o caminho:

```text
users/{uid}                → name, email, createdAt
users/{uid}/bugs/{bugId}   → title, description, severity, status, createdAt
```

| Função | Uso |
|---|---|
| `collection` / `doc` | Apontam para uma coleção ou documento |
| `setDoc` | Cria o perfil com id = uid |
| `addDoc` | Cria um bug com id automático |
| `updateDoc` | Altera só o campo `status` |
| `deleteDoc` | Exclui um bug |
| `query` + `orderBy` | Ordena os bugs por `createdAt` (mais novo primeiro) |
| `onSnapshot` | Escuta os dados em tempo real |
| `serverTimestamp` | Usa o horário do servidor em `createdAt` |

### 3.6 Tempo real com `onSnapshot`
`listenBugs()` usa `onSnapshot`, que entrega a lista inicial e depois toda alteração. O caminho de um bug novo:

```text
Usuário toca em "Salvar bug"
  → addBug() grava com addDoc
  → onSnapshot recebe a mudança
  → setBugs() atualiza o estado
  → a lista é renderizada de novo
```

A tela não precisa ser recarregada. O mesmo vale para marcar como resolvido e para excluir.

Enquanto o servidor não confirma o horário, `item.data({ serverTimestamps: "estimate" })` usa uma estimativa local, então o bug novo já aparece com data.

**Limpeza:** `onSnapshot` retorna uma função que cancela a escuta. Ela é retornada pelo `useEffect`, então a escuta acaba quando a tela sai da memória (por exemplo, no logout) ou antes de o efeito rodar de novo.

### 3.7 Hooks do React

| Hook | Onde | Para que |
|---|---|---|
| `useState` | todas as telas | Campos, lista, filtro, carregamento, erro |
| `useEffect` | `App.tsx`, `BugListScreen` | Escutar sessão, perfil e bugs; o `return` faz a limpeza |
| `useMemo` | `BugListScreen` | Calcular abertos e a lista filtrada só quando `bugs` ou `filter` mudam |
| `useRef` | `NewBugScreen` | `savingRef` bloqueia um segundo toque em "Salvar" antes da próxima renderização |
| `useLayoutEffect` | `BugListScreen` | Colocar o botão de sair no cabeçalho do Stack |
| `useContext` | `useUser()` | Ler o usuário logado |

### 3.8 Componentes, props e estado
- **Props** são dados recebidos do componente pai (ex.: `navigation` que o Stack entrega às telas).
- **State** é o dado que o próprio componente controla (ex.: `title`, `filter`).
- Os campos são **controlados**: `value={email}` e `onChangeText={setEmail}`.
- `Field` (em `LoginScreen`) é um componente reutilizável: recebe o ícone, um conteúdo opcional à direita e repassa o resto das props para o `TextInput` com `...inputProps`.
- A lista usa `FlatList` com `keyExtractor`, `renderItem` e `ListEmptyComponent`.

### 3.9 Código assíncrono e tratamento de erros
As chamadas ao Firebase usam `async/await` com `try/catch/finally`:
- `try`: executa a operação;
- `catch`: mostra um `Alert` com a mensagem de `errorMessage()`, que traduz os códigos do Firebase (`auth/invalid-credential`, `auth/email-already-in-use`, `permission-denied` etc.);
- `finally`: desliga o carregamento, mesmo se der erro.

As mensagens passam por `src/dialog.ts`: no celular usam o `Alert` nativo; no navegador, onde o `Alert` do React Native não aparece, usam `window.alert` e `window.confirm`. A escolha é feita com `Platform.OS`.

### 3.10 TypeScript
- Tipos de união: `Severity = "baixa" | "media" | "alta" | "critica"` e `BugStatus = "aberto" | "resolvido"`.
- `Pick<Bug, "title" | "description" | "severity">` define os dados do formulário (`NewBug`), sem `id`, `status` e `createdAt`, que o app preenche.
- `NativeStackScreenProps<RootStackParamList, "Bugs">` tipa `navigation` em cada tela.
- `firebase-auth.d.ts` completa a tipagem de `getReactNativePersistence`.
- Ao ler do Firestore, `listenBugs()` confere os campos (ex.: severidade inválida vira `"media"`), porque o TypeScript não valida dados que chegam do banco.

### 3.11 Segurança: regras do Firestore
Autenticação diz **quem** é o usuário; as **regras** dizem **o que ele pode acessar**. O arquivo `firestore.rules`:
- permite ler e gravar em `users/{uid}` somente quando `request.auth.uid == uid`;
- só aceita criar ou alterar bug com título de 3 a 80 caracteres, descrição até 500, severidade e status válidos.

Assim, um usuário não acessa os bugs de outro, mesmo que alguém tente fora do app.

---

## Cenários de sucesso e erro tratados

| Cenário | Comportamento |
|---|---|
| Login ou cadastro com sucesso | Abre a lista de bugs automaticamente |
| Nome com menos de 2 letras | Alerta pedindo o nome |
| E-mail em formato inválido | "Informe um e-mail válido." |
| Senha com menos de 6 caracteres | Alerta antes de chamar o Firebase |
| Senhas diferentes no cadastro | "As senhas digitadas não são iguais." |
| E-mail ou senha incorretos | "E-mail ou senha incorretos." |
| E-mail já cadastrado | "Já existe uma conta com esse e-mail." |
| Muitas tentativas de login | "Muitas tentativas seguidas…" |
| Sem internet | "Sem conexão com a internet." |
| Recuperar senha sem e-mail | Pede para digitar o e-mail primeiro |
| Recuperar senha com sucesso | Mensagem que não revela se a conta existe |
| Toque duplo em Entrar ou Salvar | Botão desabilitado / bloqueio com `useRef` |
| Bug sem título (ou menos de 3 letras) | "Falta o título" |
| Lista carregando | Indicador de carregamento |
| Lista vazia | "Nenhum bug registrado ainda…" |
| Filtro sem resultados | "Nenhum bug nesse filtro." |
| Falha ao carregar os bugs | Mensagem de erro e botão "Tentar novamente" |
| Acesso negado pelas regras | "Acesso negado pelo banco…" |
| Excluir bug | Pede confirmação antes |
| Sair | Pede confirmação; volta para o Login |
| Reabrir o app logado | Sessão restaurada sem novo login |
