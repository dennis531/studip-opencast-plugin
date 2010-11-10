<?php
/*
 * OpencastAdministration.class.php - The administarion of the opencast player
 * Copyright (c) 2010  Andr� Kla�en
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of
 * the License, or (at your option) any later version.
 */

require_once 'vendor/trails/trails.php';

class OpencastAdministration extends StudipPlugin implements AdministrationPlugin
{
    /**
     * Initialize a new instance of the plugin.
     */
    function __construct()
    {
        parent::__construct();

        global $SessSemName, $perm;

        //.. now the subnavi
        $main = new Navigation(_("Opencast Administration"));
        $main->setURL(PluginEngine::getURL('opencast/admin/config'));

        $config = new Navigation('Globale Einstellungen');
        $config->setURL(PluginEngine::getURL('opencast/admin/config'));

        $main->addSubNavigation('config', $config);
        
        Navigation::addItem('/start/opencast', $main);
        

    }    

    /**
     * This method dispatches all actions.
     *
     * @param string   part of the dispatch path that was not consumed
     */
    function perform($unconsumed_path)
    {
        $trails_root = $this->getPluginPath();
        $dispatcher = new Trails_Dispatcher($trails_root, NULL, NULL);
        $dispatcher->dispatch($unconsumed_path);
    }
}
