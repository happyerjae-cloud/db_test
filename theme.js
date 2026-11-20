// 사이트 테마(컬러 + 라이트/다크 모드)
// - 로그인 전: 기본 남색 + 라이트 모드
// - 로그인 후: user_metadata의 설정을 따름
//     favorite_color      : 가입할 때 고른 색
//     use_favorite_color  : false면 내 색을 쓰지 않고 기본 남색 (없으면 true로 취급)
//     theme_mode          : "dark" | "light" (없으면 light)
// 마지막으로 쓴 설정을 localStorage에 기억해 두었다가 페이지가 열리자마자 적용해서 깜빡임을 막음.
(function () {
  var KEY = "theme-settings";
  var DEFAULT_COLOR = "#14213d";
  var HEX = /^#[0-9a-f]{6}$/i;
  var root = document.documentElement;

  function rgb(hex) {
    return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); });
  }

  function luminance(hex) {
    var c = rgb(hex).map(function (v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  // hex의 비율(pct%)만큼 + other를 섞은 색
  function mix(hex, other, pct) {
    var a = rgb(hex), b = rgb(other);
    return "#" + a.map(function (v, i) {
      var m = Math.round(v * pct / 100 + b[i] * (100 - pct) / 100);
      return ("0" + m.toString(16)).slice(-2);
    }).join("");
  }

  function apply(s) {
    var dark = s.mode === "dark";
    var color = s.useColor && s.color && HEX.test(s.color) ? s.color : DEFAULT_COLOR;

    // 다크 모드에서 너무 어두운 색은 배경에 묻히므로 밝게 보정
    var primary = dark && luminance(color) < 0.1 ? mix(color, "#ffffff", 70) : color;
    var lum = luminance(primary);

    var text;
    if (dark) {
      text = lum < 0.25 ? mix(primary, "#ffffff", 50) : primary; // 어두운 배경 위 글자
    } else {
      text = lum > 0.4 ? mix(primary, "#000000", 50) : primary;  // 흰 배경 위 글자
    }

    root.setAttribute("data-theme", dark ? "dark" : "light");
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--on-primary", lum > 0.5 ? "#1c2330" : "#ffffff");
    root.style.setProperty("--primary-text", text);
  }

  function fromSession(session) {
    var meta = (session && session.user && session.user.user_metadata) || null;
    if (!meta) return { color: null, useColor: false, mode: "light" };
    return {
      color: meta.favorite_color || null,
      useColor: meta.use_favorite_color !== false,
      mode: meta.theme_mode === "dark" ? "dark" : "light",
    };
  }

  // 세션(로그인 정보)에 맞춰 테마를 갱신. 로그아웃이면 기본 남색 + 라이트로 되돌림.
  window.syncTheme = function (session) {
    var s = fromSession(session);
    apply(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  };

  // 페이지가 열리자마자 마지막 설정을 적용
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  apply(cached || { color: null, useColor: false, mode: "light" });
})();
