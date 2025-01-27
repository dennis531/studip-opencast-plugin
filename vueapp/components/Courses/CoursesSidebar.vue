<template>
    <div class="sidebar-widget " id="sidebar-navigation">
        <div class="sidebar-widget-header" v-translate>
            Navigation
        </div>
        <div class="sidebar-widget-content">
            <ul class="widget-list widget-links sidebar-navigation">
                <li :class="{
                    active: currentView == 'videos'
                    }"
                    v-on:click="setView('videos')">
                    <router-link :to="{ name: 'course' }">
                        Videos
                    </router-link>
                </li>
                <li :class="{
                    active: currentView == 'schedule'
                    }"
                    v-if="canSchedule"
                    v-on:click="getScheduleList">
                    <router-link :to="{ name: 'schedule' }">
                        Aufzeichnungen planen
                    </router-link>
                </li>
            </ul>
        </div>
    </div>

    <div class="sidebar-widget" v-if="currentView == 'videos'">
        <div class="sidebar-widget-header" v-translate>
            Wiedergabelisten
        </div>
        <div class="sidebar-widget-content">
            <ul class="widget-list widget-links oc--sidebar-links sidebar-navigation">
                <li :class="{
                    active: playlist?.token == p.token
                    }"
                    v-for="p in playlists"
                    v-bind:key="p.token"
                    v-on:click="setPlaylist(p)">
                    <router-link :to="{ name: 'course' }">
                        {{ p.is_default == 1 ?
                            $gettext('Kurswiedergabeliste')
                            : p.title
                        }}
                    </router-link>
                </li>

                <li v-if="canEdit" @click="showCreatePlaylist">
                    <studip-icon style="margin-top: -2px;" shape="add" role="clickable"/>
                    {{ $gettext('Wiedergabeliste anlegen') }}
                </li>
            </ul>
        </div>
    </div>

    <template v-if="currentView == 'schedule'">
        <div v-if="semester_list.length" class="sidebar-widget " id="sidebar-actions">
            <div class="sidebar-widget-header" v-translate>
                Semesterfilter
            </div>
            <div class="sidebar-widget-content">
                <select class="sidebar-selectlist submit-upon-select" v-model="semesterFilter">
                    <option v-for="semester in semester_list"
                        :key="semester.id"
                        :value="semester.id"
                        :selected="semester.id == semester_filter"
                    >
                        {{ semester.name }}
                    </option>
                </select>
            </div>
        </div>
    </template>
    <template v-else>
        <div class="sidebar-widget " id="sidebar-actions" v-if="canEdit || canUpload">
            <div class="sidebar-widget-header" v-translate>
                Aktionen
            </div>
            <div class="sidebar-widget-content">
                <ul class="widget-list oc--sidebar-links widget-links">
                    <li @click="$emit('uploadVideo')" v-if="canUpload">
                        <studip-icon style="margin-left: -20px;" shape="upload" role="clickable"/>
                        Medien hochladen
                    </li>
                    <li>
                        <a :href="recordingLink" target="_blank" v-if="canUpload">
                            <studip-icon style="margin-left: -20px;" shape="video" role="clickable"/>
                            Video aufnehmen
                        </a>
                    </li>
                    <li v-if="canToggleVisibility">
                        <a v-if="course_config['series']['visibility'] === 'invisible'" @click="setVisibility('visible')" target="_blank">
                            <studip-icon style="margin-left: -20px;" shape="visibility-invisible" role="clickable"/>
                            Reiter sichtbar schalten
                        </a>
                        <a v-else @click="setVisibility('invisible')" target="_blank">
                            <studip-icon style="margin-left: -20px;" shape="visibility-visible" role="clickable"/>
                            Reiter verbergen
                        </a>
                    </li>
                    <li v-if="canEdit">
                        <a v-if="!uploadEnabled" @click="setUpload(1)" target="_blank">
                            <studip-icon style="margin-left: -20px;" shape="decline" role="clickable"/>
                            Studierendenupload erlauben
                        </a>
                        <a v-else @click="setUpload(0)" target="_blank">
                            <studip-icon style="margin-left: -20px;" shape="accept" role="clickable"/>
                            Studierendenupload verbieten
                        </a>
                    </li>
                    <li v-if="canEdit">
                        <a @click="$emit('copyAll')">
                            <studip-icon style="margin-left: -20px;" shape="add" role="clickable"/>
                            {{ $gettext('Videos/Wiedergabelisten übertragen') }}
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <PlaylistAddCard v-if="addPlaylist"
            @done="createPlaylist"
            @cancel="cancelPlaylistAdd"
        />
    </template>
</template>

<script>
import { mapGetters } from "vuex";

import StudipIcon from '@studip/StudipIcon.vue';
import PlaylistAddCard from '@/components/Playlists/PlaylistAddCard.vue';


export default {
    name: 'episodes-action-widget',
    components: {
        StudipIcon,     PlaylistAddCard
    },

    emits: ['uploadVideo', 'recordVideo', 'copyAll'],

    data() {
        return {
            showAddDialog: false,
            semesterFilter: null,
        }
    },

    computed: {
        ...mapGetters(["playlists", "currentView", 'addPlaylist',
            "cid", "semester_list", "semester_filter", 'currentUser',
            'simple_config_list', 'course_config', 'playlist',
            'defaultPlaylist']),

        fragment() {
            return this.$route.name;
        },

        canSchedule() {
            try {
                return this.cid !== undefined && this.currentUser.can_edit && this.simple_config_list['settings']['OPENCAST_ALLOW_SCHEDULER'];
            } catch (error) {
                return false;
            }
        },

        recordingLink() {
            if (!this.simple_config_list.settings || !this.course_config) {
                return;
            }

            let config_id = this.simple_config_list.settings['OPENCAST_DEFAULT_SERVER'];
            let server    = this.simple_config_list.server[config_id];

            // use the first avai
            return window.STUDIP.URLHelper.getURL(
                server.studio, {
                    'upload.seriesId'  : this.course_config['series']['series_id'],
                    'upload.acl'       : false,
                    'upload.workflowId': this.getWorkflow(config_id),
                    'return.target'    : window.STUDIP.URLHelper.getURL('plugins.php/opencast/course?cid=' + this.cid),
                    'return.label'     : 'Stud.IP'
                }
            );
        },

        canEdit() {
            if (!this.course_config) {
                return false;
            }

            return this.course_config.edit_allowed;
        },

        canUpload() {
            if (!this.course_config) {
                return false;
            }

            return this.course_config.upload_allowed;
        },

        uploadEnabled() {
             if (!this.course_config) {
                return false;
            }

            return this.course_config.upload_enabled == 1;
        },

        canToggleVisibility() {
            return window.OpencastPlugin.STUDIP_VERSION == '4.6' && this.canEdit;
        }
    },

    methods: {
        setPlaylist(playlist) {
            this.$store.dispatch('setPlaylist', playlist);
        },

        getScheduleList() {
            this.$store.dispatch('updateView', 'schedule');
            this.$store.dispatch('clearMessages');
            this.$store.dispatch('getScheduleList');
        },

        setView(page) {
            this.$store.dispatch('updateView', page);
        },

        async setVisibility(visibility) {
            await this.$store.dispatch('setVisibility', {'cid': this.cid, 'visibility': visibility});
            this.$router.go(); // Reload page to make changes visible in navigation tab
        },

        setUpload(upload) {
            this.$store.dispatch('setUpload', {'cid': this.cid, 'upload': upload})
            .then(() => {
                this.$store.dispatch('loadCourseConfig', this.cid);
            });

        },

        showCreatePlaylist() {
            this.$store.dispatch('addPlaylistUI', true);
        },

        cancelPlaylistAdd() {
            this.$store.dispatch('addPlaylistUI', false);
        },

        createPlaylist(playlist) {
            this.$store.dispatch('addPlaylist', playlist);
        },

        getWorkflow(config_id) {
            let wf_id = this.simple_config_list?.workflow_configs.find(wf_config => wf_config['config_id'] == config_id && wf_config['used_for'] === 'studio')['workflow_id'];
            return this.simple_config_list?.workflows.find(wf => wf['id'] == wf_id)['name'];
        }
    },

    mounted() {
        this.$store.dispatch('simpleConfigListRead');
        this.$store.dispatch('loadCourseConfig', this.cid);
        this.semesterFilter = this.semester_filter;

    },

    watch: {
        semesterFilter(newValue, oldValue) {
            if (newValue && oldValue && newValue != oldValue) {
                this.$store.dispatch('setSemesterFilter', newValue);
                this.$store.dispatch('clearMessages');
                this.$store.dispatch('getScheduleList');
            }
        }
    }
}
</script>
