import { triggerRef } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';

export default new createRouter({
    history: createWebHashHistory(),
    base: window.location.pathname,
    routes: [
        {
            path: '/', redirect: to => {
                if (window.OpencastPlugin.CID === undefined) {
                    return '/contents/videos';
                } else {
                    return '/course/videos';
                }
            }
        },

        {
            path: "/contents",
            component: () => import("@/views/Contents"),
            children: [
                {
                    path: "videos",
                    name: "videos",
                    component: () => import("@/views/Videos"),
                },
                {
                    path: "videosTrashed",
                    name: "videosTrashed",
                    component: () => import("@/views/VideosTrashed"),
                },
                {
                    path: "playlists",
                    name: "playlists",
                    component: () => import("@/views/Playlists"),
                },

                {
                    path: 'playlists/:token',
                    name: 'playlist',
                    props: true,
                    component: () => import("@/views/PlaylistContents"),
                }
            ]
        },

        {
            path: "/admin",
            name: "admin",
            component: () => import("@/views/Admin"),
        },

        {
            path: "/course",
            component: () => import("@/views/Course.vue"),
            children: [
                {
                    path: "videos",
                    name: "course",
                    component: () => import("@/views/CoursesVideos"),
                },
                {
                    path: "schedule",
                    name: "schedule",
                    component: () => import("@/views/Schedule"),
                },
            ]
        },
    ]
});