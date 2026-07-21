// =============================================
// APP.JS - Lógica de Autenticação + Supabase
// =============================================

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            setLoading(btn, false);
            console.error('[JBIso] Login error:', error.code, error.message);
            showError('E-mail ou senha incorretos.');
            return;
        }

        console.log('[JBIso] Login OK:', data.user?.email);
        showError('Login realizado! Redirecionando...');
        document.getElementById('error-message').style.background = 'var(--color-success, #10b981)';
        document.getElementById('error-message').style.color = '#fff';

        setTimeout(() => {
            window.location.href = 'painel.html';
        }, 500);

    } catch (err) {
        setLoading(btn, false);
        console.error('[JBIso] Login exception:', err);
        showError('Erro de conexão. Tente novamente.');
    }
}

// -----------------------------------------
// VERIFICAR SESSÃO
// -----------------------------------------
async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('[JBIso] checkSession error:', error.message);
        }
        return session;
    } catch (err) {
        console.error('[JBIso] checkSession exception:', err);
        return null;
    }
}

// -----------------------------------------
// BUSCAR LINK DO GOOGLE DRIVE
// -----------------------------------------
async function getUserDriveLink(session) {
    try {
        const user = session?.user;
        if (!user) {
            console.error('[JBIso] getUserDriveLink: no user in session');
            return null;
        }

        const { data, error } = await supabase
            .from('usuarios')
            .select('link_google_drive, email')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('[JBIso] getUserDriveLink SELECT error:', error.code, error.message);
            return null;
        }

        return data;
    } catch (err) {
        console.error('[JBIso] getUserDriveLink exception:', err);
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
        window.location.href = 'login.html';
        return;
    }

    const userData = await getUserDriveLink(session);

    if (!userData) {
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
