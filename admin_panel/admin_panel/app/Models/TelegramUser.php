<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TelegramUser extends Model
{
    use HasFactory, CrudTrait;

    protected $fillable = [
        'first_name',
        'last_name',
        'middle_name',
        'tg_id',
        'tg_name',
        'role_id'
    ];
}
