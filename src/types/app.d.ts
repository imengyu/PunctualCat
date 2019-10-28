
import JQuery from 'jquery'
import Vue from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    $: JQuery;
  }
}

