Espo.define('custom:views/handbuch/index', ['view'], function (Dep) {

    return Dep.extend({

        template: 'custom:handbuch/index',

        setup: function () {
            Dep.prototype.setup.call(this);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            var savedLang = localStorage.getItem('handbuch_lang') || 'de';
            this.switchLang(savedLang);

            this._applySidebar();
            this._resizeHandler = this._applySidebar.bind(this);
            window.addEventListener('resize', this._resizeHandler);

            var self = this;

            this.$el.find('.hb-lang-btn').on('click', function () {
                var lang = this.getAttribute('data-lang');
                self.switchLang(lang);
                localStorage.setItem('handbuch_lang', lang);
                self._updateActiveNav();
            });

            // Клик по пункту меню — сразу подсвечиваем
            this.$el.find('.hb-nav a').on('click', function (e) {
                var href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    self.$el.find('.hb-nav a').removeClass('active');
                    $(this).addClass('active');
                    var target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });

            // Отслеживание скролла для автоподсветки
            this._scrollHandler = this._updateActiveNav.bind(this);
            window.addEventListener('scroll', this._scrollHandler, true);

            this._updateActiveNav();
        },

        _applySidebar: function () {
            var sidebar = this.$el.find('.hb-sidebar')[0];
            var main = this.$el.find('.hb-main')[0];
            var wrap = this.$el.find('.hb-wrap')[0];
            if (!sidebar || !main || !wrap) return;

            var navbar = document.querySelector('#navbar .navbar') || document.querySelector('nav.navbar');
            var navH = navbar ? Math.round(navbar.getBoundingClientRect().height) : 52;

            var sidebarW = 240;

            sidebar.style.position = 'fixed';
            sidebar.style.left = '0';
            sidebar.style.top = navH + 'px';
            sidebar.style.width = sidebarW + 'px';
            sidebar.style.height = 'calc(100vh - ' + navH + 'px)';
            sidebar.style.zIndex = '500';
            sidebar.style.overflowY = 'auto';

            var wrapLeft = wrap.getBoundingClientRect().left;
            var neededMargin = Math.max(0, sidebarW - wrapLeft + 10);
            main.style.marginLeft = neededMargin + 'px';
        },

        _updateActiveNav: function () {
            var lang = localStorage.getItem('handbuch_lang') || 'de';
            var sections = document.querySelectorAll('[id^="' + lang + '-"]');
            if (!sections.length) return;

            var scrollTop = (document.documentElement.scrollTop || document.body.scrollTop) + 120;

            var current = null;
            sections.forEach(function (section) {
                if (section.offsetTop <= scrollTop) {
                    current = section;
                }
            });

            if (!current) {
                current = sections[0];
            }

            this.$el.find('.hb-nav a').removeClass('active');
            if (current) {
                this.$el.find('.hb-nav a[href="#' + current.id + '"]').addClass('active');
            }
        },

        onRemove: function () {
            if (this._resizeHandler) {
                window.removeEventListener('resize', this._resizeHandler);
                this._resizeHandler = null;
            }
            if (this._scrollHandler) {
                window.removeEventListener('scroll', this._scrollHandler, true);
                this._scrollHandler = null;
            }
            Dep.prototype.onRemove.call(this);
        },

        switchLang: function (lang) {
            this.$el.find('.hb-content-de, .hb-content-ru').hide();
            this.$el.find('.hb-content-' + lang).show();
            this.$el.find('.hb-lang-btn').removeClass('active');
            this.$el.find('.hb-lang-btn[data-lang="' + lang + '"]').addClass('active');
        }

    });
});
