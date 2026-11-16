# God mode: personalização da plataforma

> **Origem:** SPEC 1.0, §11 God mode — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** fase 2. Na v1, o god mode só lê (conta por bootstrap com MFA, fatia 1.4), e os textos ficam no catálogo do código (`src/i18n/pt-BR.ts`) e mudam por PR; os textos legais versionados já existem na v1.

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Imagens da plataforma vão para o armazenamento S3 (ou disco no desenvolvimento), sem IndexedDB: com um só caminho de dados não existe mais "modo local".

---

## God mode

O god mode edita conteúdo e aparência da plataforma, sem mexer em código e sem tocar em dado de cliente. Antes de criar qualquer recurso para o god mode, pergunte: altera dado de cliente? Se sim, fica de fora ou vira só leitura.

Barra do god mode com "Editar esta tela": cada texto editável ganha contorno e lápis; o painel "Textos desta tela" dá o mesmo acesso pelo teclado.

Textos fixos num catálogo gerado do código (<T> e npm run catalogo), com busca, filtro por área e "só os alterados". Texto montado com dado de cliente não entra.

Textos legais (consentimento, visita, interesse) ganham versão nova a cada edição; a tela mostra quantos aceites cada versão tem.

Logotipos, símbolos, favicon e imagem de destaque trocáveis por JPG, PNG ou WebP de até 10 MB, reduzidos para até 1600 px. No modo local, ficam no IndexedDB (não no LocalStorage, por causa do limite de ~5 MB).

Nome, slogan, suporte, rodapé, cores, cantos e tamanho do texto editáveis. Cor que falha no WCAG AA é recusada.

Listas editáveis: origens do lead próprio, perguntas para a visita, formas de pagamento e itens de infraestrutura.

Histórico de cada mudança (antes, depois, data, autor), desfazer a última e restaurar a personalização.

"Exportar" e "Importar" só o conteúdo da plataforma, com validação.

Fora da edição: pesos e regras da busca, registros da base, fotos de empreendimentos e logotipos de incorporadoras.

Impersonate do god mode é só leitura.
