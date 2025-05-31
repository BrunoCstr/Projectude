# **App Name**: Hestorg Lite

## Core Features:

- Sidebar Navigation: Sidebar navigation with icons for Dashboard, My Projects, Shared with Me, and Settings.
- Dashboard Overview: Dashboard with cards displaying total projects, total collaborators and shared projects.
- Project Listing: Basic project listing page with project name, description, and status.

## Style Guidelines:

- Primary color: #14cdcd for a vibrant and modern look.
- Accent color: #FF7F50 (Coral) to highlight key actions and elements.
- Modern and responsive layout using TailwindCSS grid and flexbox.
- Use consistent and clear icons from a library like Feather or Font Awesome.
- Subtle transitions and animations for a smooth user experience.

## Original User Request:
Plataforma Projectude

Prompt inicial:
Crie um sistema completo de gerenciamento de projetos chamado Hestorg, com design moderno, responsivo e elegante. Use React, TailwindCSS e siga o estilo de UI do Radix e ShadCN.
Funcionalidades principais:
Sidebar com navegação e ícones:


Dashboard
Meus Projetos
Compartilhados comigo
Colaboradores
Comentários
Tags
Configurações
Perfil de Usuário
Alternância entre modo claro/escuro

Dashboard:
Primeiro crie algumas seções, uma seção para cards de informações, outra para graficose e outra para notificaçõs, atualizações, recados e outras coisas.
Seção de Cards de informações* 
Crie alguns cards com as seguintes informações: 
- Valor total investido em projetos 
- Quantidade total de projetos 
- Quantidade total de projetos compartilhados comigo 
- Quantidade total de colaboradores 
Seção de Graficos* 
Crie alguns Graficos com as seguintes informações: 
- Projetos criados por periodo 
- Status dos projetos por periodo 
- Quantidade de colaboradores por Projeto 
- Porcentagem de status definido para os projetos (grafico pizza, ex: de todos os projetos, 20% está com o status de Concluido) 
- Grafico para acompanhar o crescimento dos investimentos feitos por periodo Seção de notificações, atualizações e recados* Coloque alguns cards pequenos para informar quando houver atualização nova da plataforma, quando houver convite novo para colaborador, coloque também a última data que foi cadastrado e/ou atualizado o último projeto, coloque também avisos de cobrança (caso cartão seja recusado) etc. etc.



2.Meus Projetos:


Grade de cards com detalhes dos projetos (Capa em cima, depois Logomarca e nome, descrição e o restante das informações bem organizadas por ícones. Mostre também as fotos/avatares dos colaboradores atribuidos ao projeto)


Botão para "Cadastrar Novo Projeto"
> Formulário em popup com:


Upload de logomarca
Upload de Capa
Nome do projeto
Descrição
Data de início
Status (Pendente, Em andamento, Pausado, Concluído)
Opção para adicionar as tags.
Um switch perguntando se o projeto é fisico, se ativado, exiba campos para adicionar o endereço (País, Estado, Cidade, Bairro etc)
Múltiplos links com lista suspensa de ícones para definir tipo do link, ex: se for um link do facebook, selecionar o ícone do facebook (com botão para adicionar mais)
Campos de credenciais (e-mail, senha e descrição)
Seleção de múltiplos colaboradores (Um lista suspensa para selecionar os colaboradores e um switch para definir se eles podem ver ou não as informações das credenciais)
Campo para adicionar anexos (maximo 3 anexos)

3. Compartilhados Comigo:
Esta é uma aba para exibir os projetos que foi atribuido ao usuario por terceiros, aparece uma lista com o logo do projeto, o nome e algumas informações. Adicione um botão para visualizar mais detalhes para abrir um pop-up com todos os detalhes.


4.Colaboradores:


Lista em grade de colaboradores adicionados
Botão "Convidar Colaborador" abre popup para convidar por e-mail
Botão de excluir colaborador
Botão de ver perfil do colaborador (Informações do Perfil de Usuário)
	(Na mesma aba de colaboradores, adicione também uma listagem com os convites recebidos, mostrando quem convidou o usuário para ser um colaborador e uma lista suspensa com opções de aceitar ou recusar o convite, se aceitar o convite, o convidado vai para a grade de colaboradores também)

	5. Comentários:

Nesta aba, adicione um botão para Adicionar comentário, e mostre os comentários em listagem. na listagem de comentarios exiba-os como se fossem tarefas a fazer com opção para marcar “Pendente, em andamento, parado ou concluido” (lista suspensa)
Os comentários são atribuidos aos projetos criados, ao criar um comentario abre um pop-up para selecionar o projeto, o campo de comentário, e também uma atribuição a um colaborador para realizar essa tarefa.
Ainda na aba de comentários, divida em duas seções, a primeira “Meus Comentários” e a Segunda “Comentários Recebidos”. 
Em comentarios Recebidos, exiba os comentarios que chegou para o Usuario vindo de terceiros.

Nos comentarios exiba informações de data e quem criou.
Coloque também um botão para editar comentário e arquivar comentário. Crie uma tela para exibir os comentários arquivados.

Também é possivel responder aos comentários atraves de um botão no comentario “Respostas do comentário”. Ao clicar nesse botão, exiba um pop-up que mostra o historico em lista de respostas dos usuarios, mostre a foto, a resposta e quando foi respondido. Na parte inferior do pop-up de respostas de comentarios, adicione um campo para responder com possibilidade de anexar arquivo.

6. Tags:
Uma aba para adicionar tags, com botão de adicionar tags, e ao clicar no botão um pop-up pedindo o nome da Tag, a descrição e a cor da tag.



7.Configurações:


Dados da Conta: e-mail, senha, nome de usuário, endereço (etc)
Planos: exibição do plano atual, opção para adicionar cartão de crédito (pop-up com Nome do Cartão, Numero, Vencimento e Código de segurança. Também deixe a visualização do cartão com opção para deletar e definir como princial. Opção para adicionar mais cartões também) e histórico de pagamento
Opções: algumas opções de sistema para definir o idioma e a moeda/cambio
Notificações: toggle para saber quando alguem te convidou num projeto, alterou um projeto, enviou um comentário, mudou status do comentario, e-mails de marketing, ofertas, novidades



8.Perfil do Usuário:


Upload de avatar/foto
Nome
Biografia
Links de redes sociais (com opção de adicionar mais)
Campo com tags para adicionar: (Hobbies) (Habilidades e Experiencias), (Escolaridade)

9.Modo Escuro/Claro:
Botão no topo da interface para alternar entre os temas
Aparência elegante e aconchegante nos dois modos
10. Adicione também um ícone/botão de informação NO TOPO DA INTERFACE que leva para uma tela de Central de Ajuda. Dentro da tela de central de ajuda, coloque alguns itens: Barra de Pesquisa, hashtags com topicos populares(Todas as funcionalidades), adicione também uma seção de FAQs. Elabore todo o conteudo na seção de FAQs. Também adicione um pop-up ao clicar nas hastags com a descrição do que é, um passo a passo de como funciona.


Design Desejado:
Interface clara e organizada


Componentes modernos com cantos arredondados, sombreados e responsivos


Ícones representando ações e seções (ex: Sun, Moon, User, Mail, Trash)
Cor Principal: #14cdcd
(SE INSPIRE NO DASHBOARD EM ANEXO)
  