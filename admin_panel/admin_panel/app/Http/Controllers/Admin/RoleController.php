<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Illuminate\Http\Request;

class RoleController extends CrudController
{
    use ListOperation, CreateOperation, UpdateOperation, ShowOperation, DeleteOperation;

    public function setup(){
        $this->crud->setModel('App\Models\Role');
        $this->crud->setRoute(config('backpack.base.route_prefix') . '/roles');
        $this->crud->setEntityNameStrings('Роль', 'Роли');

        $this->crud->setColumns([
            [
                'name' => 'name',
                'label' => 'Название роли'
            ]
            ]);

        $this->crud->addFields([
            [
                'name' => 'name',
                'label' => 'Название роли'
            ]
        ]);
    }
}
