<template>
    <tr :key="playlist.id">
        <!-- <td>
             <input type="checkbox">
        </td>
        -->

        <td>
            <router-link :to="{ name: 'playlist_edit', params: { token: playlist.token } }">
                {{ playlist.title }}
            </router-link>

            <div class="oc--tags oc--tags-playlist">
            <Tag v-for="tag in playlist.tags" v-bind:key="tag.id" :tag="tag.tag" />
            </div>
        </td>

        <td></td>

        <!-- <td>
            <PlaylistVisibility css="oc--playlist-visibility" :visibility="playlist.visibility"/>
        </td>  -->

        <td>
            {{ playlist.videos_count }}
        </td>

        <td>
            {{ $gettext('Erstellt am:') }}
            <span v-if="playlist.mkdate">
            {{ $filters.datetime(playlist.mkdate * 1000) }} Uhr
            </span>
            <span v-else>
                {{ $gettext('unbekannt') }}
            </span>
        </td>

        <td>
           <StudipActionMenu :items="menuItems"
                @addToCourse="addToCourse(playlist)"
                @deletePlaylist="deletePlaylist(playlist)"
                @editPlaylist="$router.push({ name: 'playlist_edit', params: { token: playlist.token } })"
                @addToPlaylist="addToPlaylist(playlist)"
           />
        </td>
    </tr>
</template>

<script>
import EmptyPlaylistCard from "@/components/Playlists/EmptyPlaylistCard"
import ConfirmDialog from '@/components/ConfirmDialog'
import StudipButton from '@/components/Studip/StudipButton'
import StudipActionMenu from '@/components/Studip/StudipActionMenu'
import PlaylistVisibility from '@/components/Playlists/PlaylistVisibility.vue'
import Tag from '@/components/Tag.vue'

export default {
    name: "PlaylistCard",

    components: {
        StudipButton,           ConfirmDialog,
        EmptyPlaylistCard,      StudipActionMenu,
        PlaylistVisibility,     Tag
    },

    props: {
        playlist: Object
    },

    data() {
        return {
            menuItems: [
                {
                    id: 1,
                    label: this.$gettext('Bearbeiten'),
                    icon: 'edit',
                    emit: 'editPlaylist'
                },
                 {
                    id: 2,
                    label: this.$gettext('Videos hinzufügen'),
                    icon: 'add',
                    emit: 'addToPlaylist'
                },
                {
                    id: 2,
                    label: this.$gettext('Verknüpfte Kurse'),
                    icon: 'add',
                    emit: 'addToCourse'
                },
                {
                    id: 3,
                    label: this.$gettext('Löschen'),
                    icon: 'trash',
                    emit: 'deletePlaylist'
                }
            ]
        }
    },

    methods: {
        removeVideo() {
            let view = this;
            this.$store.dispatch('deleteVideo', this.playlist.id)
            .then(() => {
                view.DeleteConfirmDialog = false;
            });
        },

        addToCourse(playlist) {
            this.$emit('addToCourse', playlist);
        },

        deletePlaylist(playlist) {
           this.$emit('deletePlaylist', playlist);
        },

        addToPlaylist(playlist) {
            this.$store.commit('setPlaylistForVideos', playlist);
            this.$router.push({ name: 'videos'})
        }
    }
}
</script>