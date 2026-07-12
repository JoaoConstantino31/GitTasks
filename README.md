Pretende-se realizar uma aplicação web, designada GitTasks, a qual, com base num repositório GitHub e
numa data de um dos seus milestones [2], cria uma tarefa no serviço Tasks [3] do utilizador Google através
da Google Tasks API [4]. É opcional, mas valorizado, o acesso a repositórios GitHub privados.
Requisitos da aplicação:
• A aplicação só aceita pedidos de utilizadores autenticados, exceto na rota de autenticação. Os
utilizadores são autenticados através do fornecedor de identidade Google, usando o protocolo OpenID
Connect [5, 6]. Após autenticação do utilizador na aplicação é dado acesso aos serviços, em função
do papel atribuído ao utilizador pela política de segurança;
• Política de segurança para controlo de acessos: A aplicação usa o modelo RBAC1 para gerir 3 papéis
(roles): free, regular e premium:
– No papel free os utilizadores apenas podem ver milestones de repositórios github;
– No papel regular podem também adicionar tarefas a partir de milestones GitHub, usando o
nome de uma lista determinada pela aplicação GitTasks;
– No papel premium as tarefas são criadas numa lista cujo nome é determinado pelo utilizador,
adicionalmente às permissões disponíveis no papel regular.
• Deve ser visível na interface da aplicação o papel ativo;
• A política de controlo de acessos é aplicada usando a biblioteca Casbin [7]. A política é carregada no
início da aplicação e usada pela biblioteca quando necessário nos policy enforcement points (PEP)
da aplicação. Pode testar diferentes tipos de políticas usando o editor web do Casbin: https:
//casbin.org/editor/;
• O estado de autenticação entre o browser e a aplicação web é mantido através de cookies;
• Não é preciso ter uma base de dados para guardar informações sobre utilizadores, ou seja, os dados
guardados para cada utilizador na aplicação web estão apenas em memória;
• Não pode usar os SDK da Google e GitHub para realizar os pedidos aos serviços. Os mesmos têm
de ser feitos através de pedidos HTTP construídos pela aplicação web, como demonstrado durante
as aulas.
Considere os endpoints de registo e autorização de aplicações nos serviços Google e os
endpoints equivalentes do GitHub [8]:
• Registo de aplicações: https://console.developers.google.com/apis/credentials
• Authorization endpoint: https://accounts.google.com/o/oauth2/v2/auth
• Token endpoint: https://oauth2.googleapis.com/token
• UserInfo endpoint: https://openidconnect.googleapis.com/v1/userinfo