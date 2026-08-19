<div align="center">

# ⚡ EletroNIC

**App de eletrônica digital para Android — tabelas verdade, Mapa de Karnaugh, diagramas de circuito e mais, tudo offline.**

Desenvolvido por **Kauã Mazur dos Reis** (KMZ Technologies)

</div>

---

## Sobre o projeto

EletroNIC é um aplicativo Android voltado a estudantes, técnicos e entusiastas de
eletrônica digital. A proposta é reunir num só app as ferramentas que normalmente
exigem várias calculadoras/planilhas espalhadas: montar tabelas verdade, simplificar
expressões booleanas, visualizar o circuito resultante e consultar pinagem de CIs TTL
comuns — tudo funcionando **100% offline**.

## Funcionalidades

- **Simulador de portas lógicas** — AND, OR, NOT, NAND, NOR, XOR, XNOR, com
  visualização animada do circuito e dos sinais.
- **Tabela Verdade** — três modos: porta única, expressão livre (com teclado
  dedicado para os operadores booleanos) e "Montar Tabela", onde o usuário define
  a saída desejada (incluindo *don't cares*) e o app calcula a expressão minimizada.
- **Mapa de Karnaugh** — simplificação automática (2 a 4 variáveis) com
  agrupamentos destacados interativamente e detecção de padrões XOR/XNOR.
- **Diagrama Lógico** — desenha o circuito correspondente a qualquer expressão.
- **Calculadora Universal** — conversão e operações entre binário, octal, decimal
  e hexadecimal.
- **Pinagem de Chips** — consulta rápida de CIs TTL comuns (7400, 7408, 7432 etc).
- **Histórico local** — expressões salvas ficam guardadas só no aparelho, sob
  controle total do usuário (salvar/abrir/excluir).
- **Exportação em PDF/imagem** — com múltiplos fallbacks para garantir entrega
  mesmo em WebViews mais restritivos.
- **Suporte integrado** — formulário de contato com o desenvolvedor direto no app.

## Stack técnica

| Camada | Tecnologia |
|---|---|
| App shell | [Apache Cordova](https://cordova.apache.org/) (`cordova-android` fixado) |
| Frontend | HTML5, CSS3, JavaScript puro (sem frameworks) |
| PDF | [jsPDF](https://github.com/parallax/jsPDF) |
| E-mail (suporte) | [EmailJS](https://www.emailjs.com/) |
| CI/CD | GitHub Actions — build automático de APK + AAB assinados a cada push |

## Estrutura do repositório

```
├── index.html              # ponto de entrada do app
├── css/                     # estilos, divididos por seção (01-base, 02-forms...)
├── js/                      # lógica, um arquivo por módulo/tela
├── res/android/             # ícone adaptativo (Android 8+)
├── docs/                    # GitHub Pages: landing page + política de privacidade
│   ├── index.html
│   └── privacy-policy.html
└── .github/workflows/       # pipeline de build (APK + AAB assinados)
```

## Build

O app é construído automaticamente via GitHub Actions a cada push na branch
`main`, gerando um APK (para instalação/teste direto) e um AAB (para publicação
na Play Store), ambos assinados. Não é necessário rodar nada localmente para
testar — basta baixar o artefato da execução mais recente na aba
[Actions](../../actions).

## Licença

Este projeto é de código **proprietário** — veja [`LICENSE`](./LICENSE). O
repositório está público para fins de portfólio e consulta, mas isso não
concede permissão de uso, cópia ou redistribuição. Para isso, entre em
contato: **kmzsuportt1@gmail.com**.

---

<div align="center">
© 2026 KMZ Technologies — Todos os direitos reservados.
</div>
