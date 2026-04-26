<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Zaloguj się &lsaquo; WP Design &#8212; WordPress</title>
<meta name="generator" content="WordPress 6.5.2">
<link rel="stylesheet" id="login-css" href="/wp-includes/css/buttons.min.css?ver=6.5.2" type="text/css">
<style>
  body { background: #f0f0f1; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  #login { width: 320px; margin: 100px auto; padding: 0; }
  #login h1 a { display: block; text-align: center; font-size: 24px; font-weight: 700; color: #1d2327; text-decoration: none; margin-bottom: 24px; }
  .login-form { background: #fff; border: 1px solid #c3c4c7; border-radius: 4px; padding: 26px 24px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
  label { display: block; font-size: 14px; font-weight: 600; color: #1d2327; margin-bottom: 4px; }
  input[type=text], input[type=password] { width: 100%; padding: 8px 10px; border: 1px solid #8c8f94; border-radius: 4px; font-size: 14px; box-sizing: border-box; margin-bottom: 16px; }
  input[type=submit] { width: 100%; background: #2271b1; color: #fff; border: none; border-radius: 4px; padding: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
  input[type=submit]:hover { background: #135e96; }
  #nav { margin-top: 16px; text-align: center; font-size: 13px; }
  #nav a { color: #2271b1; text-decoration: none; }
  p.message { background: #fff; border: 1px solid #c3c4c7; padding: 12px; margin-bottom: 16px; font-size: 13px; color: #1d2327; border-radius: 4px; }
</style>
</head>
<body class="login login-action-login wp-core-ui">
<div id="login">
  <h1><a href="https://wp-design.org/">WP Design</a></h1>
  <form name="loginform" id="loginform" action="/wp-login.php" method="post" class="login-form">
    <p>
      <label for="user_login">Nazwa użytkownika lub adres e-mail</label>
      <input type="text" name="log" id="user_login" autocomplete="username" value="" size="20">
    </p>
    <p>
      <label for="user_pass">Hasło</label>
      <input type="password" name="pwd" id="user_pass" autocomplete="current-password" value="" size="20">
    </p>
    <p class="forgetmenot">
      <label for="rememberme">
        <input name="rememberme" type="checkbox" id="rememberme" value="forever">
        Zapamiętaj mnie
      </label>
    </p>
    <p class="submit">
      <input type="submit" name="wp-submit" id="wp-submit" class="button button-primary button-large" value="Zaloguj się">
      <input type="hidden" name="redirect_to" value="/wp-admin/">
      <input type="hidden" name="testcookie" value="1">
    </p>
  </form>
  <p id="nav">
    <a href="/wp-login.php?action=lostpassword">Nie pamiętasz hasła?</a>
  </p>
</div>
<script>
  document.cookie = "wordpress_test_cookie=WP Cookie check; path=/";
</script>
</body>
</html>
