````markdown
# AGENTS.md

# Roku TV App — Product Specification & System Solution Design (SSD)

**Version:** 1.0.0  
**Status:** Approved – Development Ready  
**Platform:** Roku OS (SceneGraph)  
**Language:** BrightScript + XML SceneGraph

---

# Decision History

- 2026-07-26: Projeto iniciado.
- 2026-07-26: Definido SceneGraph como framework oficial.
- 2026-07-26: Aplicação composta inicialmente por Home + Player.
- 2026-07-26: Arquitetura preparada para consumo de Feed Local e Remoto.
- 2026-07-26: Separação em camadas (UI, Services, Tasks, Models e Utils).
- 2026-07-26: Repositório oficial definido em https://github.com/olavomello/roku-app.git.
- 2026-07-26: Arquitetura preparada para evolução para o Roku Content Feed oficial.

---

# Objetivo

Desenvolver um aplicativo Roku TV moderno utilizando SceneGraph, preparado para crescimento, seguindo integralmente as recomendações oficiais da Roku.

O MVP deverá possuir apenas duas telas:

- Lista de vídeos
- Player

Toda arquitetura deverá permitir evolução sem necessidade de refatoração estrutural.

---

# Referências Oficiais

Toda implementação deverá seguir prioritariamente:

## Roku Developer

https://developer.roku.com/dev/docs/

## Roku Content Feed

https://developer.roku.com/dev/docs/content-feed

Nenhuma implementação deverá contrariar as recomendações oficiais da Roku.

---

# Repositório Oficial

GitHub

```
https://github.com/olavomello/roku-app.git
```

Estratégia de Branches

```
main
```

Produção

```
develop
```

Integração

```
feature/*
```

Novas funcionalidades

```
bugfix/*
```

Correções

```
release/*
```

Preparação para publicação

---

# Arquitetura

Arquitetura baseada em SceneGraph.

```
                 Roku App

                     │

               MainScene

                     │

      ┌──────────────┴───────────────┐

      │                              │

 Navigation                 FeedService

      │                              │

      ▼                              ▼

 HomeScene                    LoadFeedTask

      │                              │

      ▼                              ▼

 VideoPlayer                 FeedParser

                                      │

                                      ▼

                                 VideoModel

                                      │

                                      ▼

                                ContentNode
```

---

# Estrutura do Projeto

```
roku-app/

│

├── manifest

├── README.md

├── AGENTS.md

├── CHANGELOG.md

├── LICENSE

├── .gitignore

├── .editorconfig

├── .gitattributes

│

├── source/

│      main.brs

│      App.brs

│

├── components/

│      MainScene.xml

│      MainScene.brs

│

├── screens/

│      HomeScene.xml

│      HomeScene.brs

│

│      PlayerScene.xml

│      PlayerScene.brs

│

├── services/

│      FeedService.brs

│      FeedParser.brs

│

├── tasks/

│      LoadFeedTask.xml

│      LoadFeedTask.brs

│

├── models/

│      VideoModel.brs

│

├── utils/

│      Logger.brs

│      Constants.brs

│      Config.brs

│

├── feeds/

│      sample-feed.json

│

├── assets/

│      images/

│      fonts/

│

└── docs/

       architecture.md

       roadmap.md
```

---

# MVP

O MVP deverá implementar apenas o fluxo abaixo.

```
Start

↓

Carrega Feed

↓

Lista de Vídeos

↓

Seleciona Vídeo

↓

Player

↓

Back

↓

Lista
```

---

# Funcionalidades

## Home

Exibir:

- Thumbnail
- Título

Layout simples.

Sem categorias.

Sem busca.

Sem favoritos.

Sem login.

---

## Player

Utilizar componente nativo SceneGraph Video.

Requisitos

- autoplay
- pause
- stop
- controles padrões Roku

Ao pressionar Back:

Retornar para Home restaurando o foco.

---

# Feed

## Primeira versão

Arquivo local

```
feeds/sample-feed.json
```

## Segunda versão

Feed remoto

Exemplo

```
https://api.site.com/feed.json
```

A UI nunca deverá conhecer a origem dos dados.

---

# Modelo Inicial

```json
{
    "videos": [
        {
            "id": "1",
            "title": "Video 01",
            "description": "",
            "thumbnail": "",
            "url": ""
        }
    ]
}
```

Posteriormente o parser deverá adaptar este modelo para o Roku Content Feed oficial.

---

# Responsabilidades

## MainScene

Responsável por

- Inicialização
- Navegação
- Ciclo de Vida

Nunca deverá acessar APIs.

---

## HomeScene

Responsável por

- Lista
- Navegação
- Foco

Nunca deverá realizar download.

---

## PlayerScene

Responsável por

- Reprodução
- Eventos
- Encerramento

Nunca deverá acessar Feed.

---

## FeedService

Responsável por

- Download
- Cache futuro
- Tratamento de erros

---

## FeedParser

Responsável por

Converter

JSON

↓

VideoModel

↓

ContentNode

---

## LoadFeedTask

Toda comunicação HTTP deverá ocorrer exclusivamente através de Task Nodes.

Nunca realizar download diretamente dentro das Scenes.

---

## Models

Somente representação dos dados.

Nenhuma lógica de UI.

---

## Utils

- Logger
- Config
- Constantes
- Helpers

---

# Navegação

```
MainScene

↓

Home

↓

Player

↓

Back

↓

Home
```

Nenhuma Scene poderá abrir outra diretamente.

Toda navegação deverá ser centralizada.

---

# Convenções

## BrightScript

- PascalCase para componentes.
- camelCase para variáveis.
- UPPER_CASE para constantes.

---

## XML

Um componente por arquivo.

---

## Comentários

Todos os arquivos deverão conter:

- Objetivo
- Responsabilidade
- Dependências
- Eventos públicos

---

# Logs

Criar Logger centralizado.

Níveis

```
DEBUG

INFO

WARN

ERROR
```

Todos os serviços deverão utilizar Logger.

---

# Tratamento de Erros

Feed indisponível

↓

Tela de erro

↓

Botão "Tentar novamente"

Vídeo indisponível

↓

Mensagem

↓

Retorna para Home

---

# Manifest

O manifest deverá permanecer o mais simples possível.

Será configurado para:

- Full HD
- Ícones HD/FHD
- Splash Screen
- Versionamento
- Nome do Canal

---

# Regras de Desenvolvimento

## Sempre

- Utilizar SceneGraph.
- Utilizar BrightScript.
- Utilizar Task Nodes.
- Componentes pequenos.
- Uma responsabilidade por arquivo.
- Código reutilizável.
- Separação de responsabilidades.
- Preparar componentes para testes futuros.

---

## Nunca

- Misturar UI com lógica.
- Fazer HTTP dentro da UI.
- Duplicar código.
- Criar componentes monolíticos.
- Utilizar variáveis globais desnecessárias.

---

# Git

Commits

```
feat:

fix:

docs:

refactor:

test:

chore:
```

Pull Requests deverão conter

- Objetivo
- Checklist
- Evidências
- Screenshots quando aplicável

---

# Roadmap

## Sprint 1

- Estrutura do projeto
- MainScene
- Home
- Player
- Feed Local

---

## Sprint 2

- Feed remoto
- FeedService
- FeedParser
- LoadFeedTask

---

## Sprint 3

- Loading
- Retry
- Error Screen
- Cache

---

## Sprint 4

- Categorias
- Continue Watching
- Favoritos

---

## Sprint 5

- Busca
- Analytics
- Deep Linking
- Publicação

---

# Critérios de Qualidade

O projeto deverá:

- Seguir integralmente a documentação oficial da Roku.
- Possuir baixo acoplamento.
- Ser modular.
- Ser facilmente testável.
- Ser facilmente documentável.
- Permitir crescimento sem refatoração estrutural.

---

# Publicação

Antes da publicação deverão ser verificados:

- Manifest
- Assets
- Ícones
- Splash Screen
- Versionamento
- Performance
- Navegação
- Uso de memória
- Compatibilidade com Roku Certification

---

# Objetivo Final

Construir um aplicativo Roku profissional que sirva como base para futuras funcionalidades, incluindo:

- Feed oficial Roku
- HLS
- DRM
- DASH
- Live TV
- Continue Watching
- Histórico
- Favoritos
- Perfis
- Multi Idioma
- Closed Caption
- Analytics
- Deep Linking
- Publicação na Roku Channel Store

Toda evolução futura deverá preservar esta arquitetura, mantendo o projeto organizado, modular e aderente às melhores práticas recomendadas pela Roku.
````
