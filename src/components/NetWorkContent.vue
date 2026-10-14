<template>
    <div class="network-content">
        <div id="push-slider" class="swiper-container" v-if="OptionSwiper.data !== null">
            <div class="swiper-wrapper">
                <div class="swiper-items" v-for="item in OptionSwiper.data" :key="item.id">
                    <img :_src="item.src" :alt="item.title" />
                    <span class="swiper-desc">
                        {{ item.desc }}
                    </span>
                </div>
            </div>
            <div id="points" class="pagination"></div>
            <div id="next" class="btn btn-next"></div>
            <div id="prev" class="btn btn-prev"></div>
        </div>
    </div>
</template>
<script setup>
import { nextTick, onMounted, onUnmounted, reactive } from 'vue';
import SimSwiper from '../lib/sim-swiper/swiper.min.js'
let p = null;
const OptionSwiper = reactive({
    data: null
});
function loadData(call) {
    const fakeData = [{
        id: 0,
        title: "鸡你太美",
        src: "https://img.alicdn.com/imgextra/i3/O1CN01h3BUKOSBGJE26uum_!!6000000007645-2-tps-1040-384.png",
        "data-id": "21dsjowq",
        desc: "测试内容"
    }, {
        id: 1,
        title: "你干嘛",
        src: "https://img.alicdn.com/imgextra/i2/O1CN01raYkYK1FbnWyyRAjM_!!6000000000506-2-tps-1040-384.png",
        "data-id": "21dsjowq",
        desc: "测试内容"
    }, {
        id: 2,
        title: "你干嘛",
        src: "https://img.alicdn.com/imgextra/i4/O1CN01epGuCc23MtL1Hs2R3_!!6000000007242-0-tps-1040-384.jpg",
        "data-id": "21dsjowq",
        desc: "测试内容"
    }]
    OptionSwiper.data = fakeData;

    if (typeof call === 'function') {
        call.call(this, []);
    }
}
onMounted(() => {
    loadData()
    nextTick(() => {
        p = new SimSwiper("#push-slider", {
            loop: true,
            lazy: {
                enable: true,
                prop: "_src"
            },
            navigator:{
                next:"#next",
                prev:"#prev"
            },
            gutter: 12,
            mouseWheel: {
                reverse: false
            },
            pagination: {
                el: "#points",
                click: true
            }
        });
    })
});

onUnmounted(() => {
    p = null;
})
function playMusic(e) {

}
</script>
<style lang="scss" scoped>
@use "sass:math";
@import url("../lib/sim-swiper/swiper.min.css");

$radius : 20px;

.network-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: $radius - 6px;

    #push-slider {
        user-select: none;
        width: 420px;
        height: 180px;
        border: none;
        border-radius: $radius;

        .swiper-items {
            border-radius: $radius;
            overflow: hidden;

            &.swiper-slide-active {
                img {
                    display: block;
                }
            }

            img {
                display: none;
                width: 100%;
                height: 100%;
            }
            position: relative;
            .swiper-desc {
                position: absolute;
                bottom: 0;
                min-width: 40px;
                max-width: 100%;
                z-index: 1;
                padding: 12px;
                left: 0;
                text-shadow: 2px 2px 10px #000000;
                box-sizing: border-box;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }
        }
    }

    ::v-deep(.pagination) {
        display: flex;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);

        .pagination-items {
            border: 1px solid var(--border);
            width: math.div($radius , 2);
            height: math.div($radius , 2);
            cursor: pointer;
            margin-left: 2px;
            margin-right: 2px;
            border-radius: $radius;
            background-color: var(--accent-1);
            display: block;
            margin-bottom: 22px;

            &.pagination-items-active {
                background-color:  var(--accent-2);
            }
        }
    }

}
</style>