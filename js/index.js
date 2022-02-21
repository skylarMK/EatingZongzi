var app = {
    el: "#app",
    data: {
        name: 'EatingZongzi',
        user: {
            id: 0,
            name: "",
            email: "",
            token: "",
            hasAgreed: null
        },
        timer: {
            value: 0,
            preload: 5,
            max: 10
        },
        game: {
            // 0: 結束, 1: 預備中, 2: 進行中, 3: 認證中
            playState: 0,
            // 0: 遊戲主畫面, 1: 結尾
            scene: 0,
            score: 0,
            baseline: 5,
            historyId: 0
        },
        isBlockShareBox: false,
        isBlockGift: false,
        isBlockAttention: false
    },
    created: function () {
        this.timer.value = this.timer.max;
    },
    computed: {
        timerControlClass: function () {
            return {
                "iteration-5": this.game.playState == 1,
                "iteration-10": this.game.playState == 2,
            };
        },
        eatingImage: function () {
            return "images/eat" + this.game.score % 10 + ".png";
        },
        zongziNum: function () {
            return Math.floor(this.game.score / 10);
        },
        isClear: function () {
            return this.zongziNum >= this.game.baseline;
        }
    },
    methods: {
        play: function () {
            if (!this.user.hasAgreed) {
                this.user.hasAgreed = false;
                return false;
            }

            if (!register()) {
                return false;
            }

            // console.log('Start ...');
            this.game.playState = 1;
            this.timer.value = this.timer.preload;
        },
        timerController: function (isEnd) {
            this.timer.value--;

            if (isEnd) {
                switch (this.game.playState) {
                    case 1:
                        this.onPreloaded();
                        break;
                    case 2:
                        this.onClear();
                        break;
                }
            }
        },
        onPreloaded: function () {
            this.game.score = 0;
            this.game.playState = 2;
            this.timer.value = this.timer.max;
        },
        onClear: function () {
            this.game.scene = 1;
            this.game.playState = 0;
            this.timer.value = this.timer.max;

            $.ajax({
                method: "POST",
                url: "https://event.setn.com/api/score/EatingZongzi",
                data: {
                    "fb_id": this.user.id,
                    "name": this.user.name,
                    "email": this.user.email,
                    "num": this.zongziNum
                },
                dataType: "json",
                context: this,
                success: function (response) {
                    this.game.historyId = response.id;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                }
            });

        },
        replay: function () {
            this.game.scene = 0;
        },
        mouseClick: function (e) {
            if(this.game.playState == 0) {
                this.play();
                return false;
            }

            this.game.score++;
            // console.log(this.game.score);
        },
        toggleShareBox: function (e) {
            this.setCanvas();
            this.isBlockShareBox ^= true;
        },
        setCanvas: function (e) {
            var canvas = this.$refs['sketchpad'];
            var ctx = canvas.getContext('2d');

            var img = new Image();
            img.onload = function () {
                ctx.drawImage(img, 0, 0);

                var pic = new Image();
                pic.onload = function () {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(162, 130, 75, 0, Math.PI * 2, false);
                    ctx.clip();

                    ctx.drawImage(pic, 82, 52);
                    ctx.closePath();
                    ctx.restore();
                };

                pic.src = 'https://graph.facebook.com/' + vm.user.id + '/picture?width=150&height=150';

                ctx.font = "30px 'Noto Sans TC'";
                ctx.fillStyle = "#f42c5c";
                ctx.fillText(vm.user.name, 274, 80);
                ctx.fillStyle = "#8c3910";
                ctx.fillText(vm.zongziNum, 322, 168);
            };

            img.src = 'images/600x315.jpg';

        },
        FacebookShare: function () {
            facebookMe.target.refer = "EatingZongzi";
            facebookMe.target.href = "https://event.setn.com/share/EatingZongzi/" + this.game.historyId;
            facebookMe.target.hashtag = "#玩遊戲抽萬元家電";
            facebookMe.share();
        }
    }
};

function register() {
    vm.game.playState = 3;
    if (!vm.user.token.length) {
        openFacebookRegister();
        return false;
    }

    // if (!facebookMe.id) {
    //     facebookMe.connect(vm.play);
    //     return false;
    // }

    // if (facebookMe.id != vm.user.id) {
    //     openFacebookRegister();
    //     return false;
    // }

    // facebookMe.id = 0;
    return true;
}

function openFacebookRegister() {
    window.open('https://memberapi.setn.com/Customer/FacebookLoginForEvent?e=' + vm.name, '', config = 'height=800,width=600');
    return true;
}

function callbackFacebookLogin(data) {
    if (data.result !== true) {
        return false;
    }

    vm.user.token = data.GetObject.token;
    $.ajax({
        method: "GET",
        url: "https://event.setn.com/api/user",
        data: { token: vm.user.token },
        dataType: "json",
        context: this,
        success: function (response) {
            vm.user.id = response.fb_id;
            vm.user.name = response.name;
            vm.user.email = response.email;
            vm.play();
        },
        error: function (jqXHR, textStatus, errorThrown) {
        }
    });
}

$(document).ready(function () {
    if (document.location.protocol == "http:") {
        window.location.replace(window.location.href.replace("http:", "https:"));
    }

    vm = new Vue(app);
    window.addEventListener('message', function (event) {
        if ((event.origin.indexOf('setn.com') != -1) || (event.origin.indexOf('sanlih.com.tw') != -1)) {
            callbackFacebookLogin(event.data);
        }
    });

    $(document)
        .on('click', '.playBtn', function (e) {
        });
});
