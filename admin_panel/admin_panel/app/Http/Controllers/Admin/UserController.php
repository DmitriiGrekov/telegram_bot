<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;

class UserController extends CrudController
{

    use ListOperation, ShowOperation, CreateOperation, UpdateOperation, DeleteOperation;

    public function setup(){
        $this->crud->setModel('App\Models\TelegramUser');
        $this->crud->setRoute(config('backpack.base.route_prefix') . '/users');
        $this->crud->setEntityNameStrings('Пользователь', 'Пользователи');

        $roles = $this->roles();

        $this->crud->setColumns([
            [
                'name' => 'first_name',
                'label' => 'Имя'
            ],
            [
                'name' => 'middle_name',
                'label' => 'Фамилия'
            ],
            [
                'name' => 'last_name',
                'label' => 'Отчество'
            ],
            [
                'name' => 'tg_id',
                'label' => 'Телеграм ID'
            ],
            [
                'name' => 'tg_name',
                'label' => 'Телеграм Логин'
            ],
            [
                'name' => 'date_time_start',
                'lable' => 'Время старта'
            ],
            [
                'name' => 'date_time_end',
                'lable' => 'Время окончания работы'
            ],
            [
                'name' => 'status',
                'lable' => 'Статус рабочего'
            ],
            [

                'lable' => 'Роль',
                'name' => 'role_id',
                'type' => 'closure',
                'function' => function($entry) use($roles){
                    if(!$entry->role_id) return '-';
                    return $roles[$entry->role_id];
                }
            ]

            ]);

        $this->crud->addFields([
            [
                'name' => 'first_name',
                'label' => 'Имя'
            ],
            [
                'name' => 'middle_name',
                'label' => 'Фамилия'
            ],
            [
                'name' => 'last_name',
                'label' => 'Отчество'
            ],
            [
                'name' => 'tg_id',
                'label' => 'Телеграм ID'
            ],
            [
                'name' => 'tg_name',
                'label' => 'Никнейм в телеграм'
            ],
            [
                'lable' => 'Роль',
                'name' => 'role_id',
                'type' => 'select_from_array',
                'options' => $roles
            ]

        ]);
    }

    private function roles(): array
    {
        $roles = (new Role())->get();
        $response = [];

        foreach($roles as $role){
            $response[$role->id] = $role->name;
        }

        return $response;
    }



}
