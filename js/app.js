// =============================================
// APP.JS - Lógica de Autenticação + Supabase
// =============================================

// Inicializa o cliente Supabase
console.log('[JBIso] SUPABASE_URL:', SUPABASE_URL);
console.log('[JBIso] SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'MISSING');

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('[JBIso] Cliente Supabase inicializado:', supabase ? 'OK' : 'FALHOU');

// -----------------------------------------
// LOGIN
// -----------------------------------------
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('btn-login');
    const errorMsg = document.getElementById('error-message');

    errorMsg.style.display = 'none';
    errorMsg.textContent = '';

    if (!email || !password) {
        showError('Preencha todos os campos.');
        return;
    }

    setLoading(btn, true);

    console.log('[JBIso] Tentando login com email:', email);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        console.log('[JBIso] Resposta do login - error:', error);
        console.log('[JBIso] Resposta do login - data:', data);

        if (error) {
            setLoading(btn, false);
            console.error('[JBIso] CÓDIGO DO ERRO:', error.code || 'N/A');
            console.error('[JBIso] MENSAGEM DO ERRO:', error.message);
            console.error('[JBIso] STATUS DO ERRO:', error.status || 'N/A');
            console.error('[JBIso] ERRO COMPLETO:', JSON.stringify(error, null, 2));

            const detalhes = 'Código: ' + (error.code || 'N/A') + '\nMensagem: ' + error.message + '\nStatus: ' + (error.status || 'N/A');
            alert('ERRO AO FAZER LOGIN:\n\n' + detalhes);

            showError('Erro ao fazer login. Verifique o console (F12) para detalhes.');
            return;
        }

        console.log('[JBIso] Login bem-sucedido! user:', data.user?.id, 'email:', data.user?.email);
        alert('Login OK! Usuário: ' + (data.user?.email || 'N/A') + '\nRedirecionando para o painel...');

        window.location.href = 'painel.html';

    } catch (err) {
        setLoading(btn, false);
        console.error('[JBIso] EXCEÇÃO NO LOGIN:', err);
        console.error('[JBIso] Tipo do erro:', err?.constructor?.name);
        console.error('[JBIso] Mensagem:', err?.message);
        console.error('[JBIso] Stack:', err?.stack);
        alert('EXCEÇÃO AO FAZER LOGIN:\n\n' + (err?.message || err));
        showError('Erro de conexão. Verifique o console (F12).');
    }
}

// -----------------------------------------
// VERIFICAR SESSÃO
// -----------------------------------------
async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[JBIso] checkSession - session:', session ? 'EXISTE (user: ' + session.user?.email + ')' : 'NULL');
        if (error) {
            console.error('[JBIso] checkSession - erro:', error.message);
        }
        return session;
    } catch (err) {
        console.error('[JBIso] checkSession - EXCEÇÃO:', err);
        return null;
    }
}

// -----------------------------------------
// BUSCAR LINK DO GOOGLE DRIVE
// -----------------------------------------
async function getUserDriveLink() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[JBIso] getUserDriveLink - user:', user ? user.id + ' (' + user.email + ')' : 'NULL');

        if (!user) return null;

        const { data, error } = await supabase
            .from('usuarios')
            .select('link_google_drive, email')
            .eq('id', user.id)
            .single();

        console.log('[JBIso] getUserDriveLink - SELECT data:', data);
        if (error) {
            console.error('[JBIso] getUserDriveLink - SELECT código:', error.code || 'N/A');
            console.error('[JBIso] getUserDriveLink - SELECT mensagem:', error.message);
            console.error('[JBIso] getUserDriveLink - SELECT details:', error.details);
            console.error('[JBIso] getUserDriveLink - SELECT hint:', error.hint);
            return null;
        }

        return data;
    } catch (err) {
        console.error('[JBIso] getUserDriveLink - EXCEÇÃO:', err);
        return null;
    }
}

// -----------------------------------------
// LOGOUT
// -----------------------------------------
async function handleLogout() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    } catch (err) {
        console.error('Logout error:', err);
        window.location.href = 'login.html';
    }
}

// -----------------------------------------
// UTILITÁRIOS
// -----------------------------------------
function showError(message) {
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
}

function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;
        btn.innerHTML = '<span class="loading-spinner"></span> Entrando...';
    } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || 'Entrar';
    }
}

// -----------------------------------------
// ATUALIZAR NAV (mostrar/esconder Sair)
// -----------------------------------------
async function updateNav() {
    const session = await checkSession();
    const navSair = document.getElementById('nav-sair');
    const navLogin = document.getElementById('nav-login');

    if (session) {
        if (navSair) navSair.style.display = 'inline-block';
        if (navLogin) navLogin.style.display = 'none';
    } else {
        if (navSair) navSair.style.display = 'none';
        if (navLogin) navLogin.style.display = 'inline-block';
    }
}

// -----------------------------------------
// PAINEL - Carregar dados do usuário
// -----------------------------------------
async function loadPainel() {
    const session = await checkSession();

    if (!session) {
        alert('[JBIso] Nenhuma sessão ativa. Redirecionando para login.');
        window.location.href = 'login.html';
        return;
    }

    alert('[JBIso] Sessão ativa! Buscando dados do usuário...');

    const userData = await getUserDriveLink();

    if (!userData) {
        alert('[JBIso] userData é NULL! A tabela "usuarios" pode não ter uma linha com o ID do usuário.\n\nVerifique o console (F12) para detalhes do erro SELECT.');
        document.getElementById('painel-content').innerHTML = `
            <div class="painel-card">
                <div class="painel-icon">!</div>
                <h2>Erro ao carregar dados</h2>
                <p>Sua conta foi encontrada, mas não há dados vinculados. Entre em contato com o suporte.</p>
                <button class="btn-logout" onclick="handleLogout()">Sair</button>
            </div>
        `;
        document.getElementById('painel-loading').style.display = 'none';
        document.getElementById('painel-content').style.display = 'block';
        return;
    }

    alert('[JBIso] Dados carregados OK! Email: ' + userData.email);

    document.getElementById('user-email').textContent = userData.email;
    document.getElementById('drive-link').href = userData.link_google_drive;
    document.getElementById('painel-loading').style.display = 'none';
    document.getElementById('painel-content').style.display = 'block';
}

// -----------------------------------------
// MENU MOBILE
// -----------------------------------------
function toggleMenu() {
    document.querySelector('.nav').classList.toggle('open');
}
