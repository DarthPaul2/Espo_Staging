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

            var self = this;

            this.$el.find('.hb-lang-btn').on('click', function () {
                var lang = this.getAttribute('data-lang');
                self.switchLang(lang);
                localStorage.setItem('handbuch_lang', lang);
            });

            // Плавная прокрутка по якорям в боковом меню
            this.$el.find('.hb-nav a').on('click', function (e) {
                var href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    var target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        },

        switchLang: function (lang) {
            this.$el.find('.hb-content-de, .hb-content-ru').hide();
            this.$el.find('.hb-content-' + lang).show();
            this.$el.find('.hb-lang-btn').removeClass('active');
            this.$el.find('.hb-lang-btn[data-lang="' + lang + '"]').addClass('active');
        }

    });
});
