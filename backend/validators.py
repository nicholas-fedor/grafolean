import re
from flask_inputs import Inputs
from flask_inputs.validators import JsonSchema
import wtforms.validators as val


DashboardInputs = {
    'type': 'object',
    'properties': {
        'name': {'type': 'string', 'minLength': 1, 'maxLength': 200},
        'slug': {'type': 'string', 'pattern': '^[0-9a-z-]{0,50}$'},
    },
    'additionalProperties': False,
    'required': ['name'],
}


WidgetSchemaInputs = {
    'type': 'object',
    'properties': {
        'type': {'type': 'string'},
        'title': {'type': 'string'},
        'p': {'type': 'string', 'minLength': 1, 'maxLength': 20},
        'content': {'type': 'string'},
    },
    'additionalProperties': False,
    'required': ['type', 'title', 'content'],
}


WidgetsPositionsSchemaInputs = {
    'type': 'array',
    'items': {
        'type': 'object',
        'properties': {
            'widget_id': {'type': 'number'},
            'x': {'type': 'number'},
            'y': {'type': 'number'},
            'w': {'type': 'number'},
            'h': {'type': 'number'},
            'p': {'type': 'string', 'minLength': 1, 'maxLength': 20},
        },
        'additionalProperties': False,
        'required': ['widget_id', 'x', 'y', 'w', 'h'],
    },
}


PersonSchemaInputsPOST = {
    'type': 'object',
    'properties': {
        'username': {'type': 'string'},
        'password': {'type': 'string'},
        'name': {'type': 'string'},
        'email': {'type': 'string'},
    },
    'additionalProperties': False,
    'required': ['username', 'password', 'name', 'email'],
}


PersonSchemaInputsPUT = {
    'type': 'object',
    'additionalProperties': False,
    'properties': {
        'username': {'type': 'string'},
        'name': {'type': 'string'},
        'email': {'type': 'string'},
    },
}


PersonChangePasswordSchemaInputsPOST = {
    'type': 'object',
    'properties': {
        'old_password': {'type': 'string'},
        'new_password': {'type': 'string'},
    },
    'additionalProperties': False,
    'required': ['old_password', 'new_password'],
}


PersonCredentialSchemaInputs = {
    'type': 'object',
    'properties': {
        'username': {'type': 'string'},
        'password': {'type': 'string'},
    },
    'additionalProperties': False,
    'required': ['username', 'password'],
}


AccountSchemaInputs = {
    'type': 'object',
    'properties': {
        'name': {'type': 'string'},
    },
    'additionalProperties': False,
    'required': ['name'],
}


PermissionSchemaInputs = {
    'type': 'object',
    'properties': {
        'resource_prefix': {'type': ['string', 'null']},
        'methods': {
            'type': ['array', 'null'],
            'items': {
                'type': 'string',
                'enum': ['GET', 'POST', 'PUT', 'DELETE'],
            },
            'uniqueItems': True,
            'minItems': 1,
        },
    },
    'additionalProperties': False,
    'required': ['resource_prefix', 'methods'],
}


class BotSchemaInputs(Inputs):
    json = [JsonSchema(schema={
        'type': 'object',
        'additionalProperties': False,
        'properties': {
            'name': {'type': 'string'},
            'protocol': {'type': ['string', 'null']},
        },
        'required': ['name'],
    })]


class AccountBotSchemaInputs(Inputs):
    json = [JsonSchema(schema={
        'type': 'object',
        'additionalProperties': False,
        'properties': {
            'name': {'type': 'string'},
            'protocol': {'type': ['string', 'null']},
            'config': {'type': ['string', 'null']},
        },
        'required': ['name'],
    })]


class EntitySchemaInputs(Inputs):
    json = [JsonSchema(schema={
        'type': 'object',
        'additionalProperties': False,
        'properties': {
            'name': {'type': 'string'},
            'entity_type': {'type': 'string'},
            'parent': {'type': ['number', 'null']},
            'details': {'type': 'object'},
            'protocols': {
                'type': 'object',
                'additionalProperties': {
                    # we don't define any properties (because keys are protocols and are not known in advance), but any
                    # protocol definition must conform to this sub-schema:
                    'type': 'object',
                    'properties': {
                        'credential': {'type': ['string', 'number']},
                        'bot': {'type': ['string', 'number']},
                        'sensors': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'sensor': {'type': ['string', 'number']},
                                    'interval': {'type': ['number', 'null']},
                                },
                                'additionalProperties': False,
                                'required': ['sensor'],
                            },
                        },
                    },
                    'required': ['credential', 'bot', 'sensors'],
                    'additionalProperties': False,
                },
            },
        },
        'required': ['name', 'entity_type', 'details'],  # note that 'protocols' is not required
    })]


class CredentialSchemaInputs(Inputs):
    json = [JsonSchema(schema={
        'type': 'object',
        'additionalProperties': False,
        'properties': {
            'name': {'type': 'string'},
            'protocol': {'type': 'string'},
            'details': {'type': 'object'},
        },
        'required': ['name', 'protocol', 'details'],
    })]


class SensorSchemaInputs(Inputs):
    json = [JsonSchema(schema={
        'type': 'object',
        'additionalProperties': False,
        'properties': {
            'name': {'type': 'string'},
            'protocol': {'type': 'string'},
            'default_interval': {'type': ['number', 'null']},
            'details': {'type': 'object'},
        },
        'required': ['name', 'protocol', 'default_interval', 'details'],
    })]

class PathSchemaInputs(Inputs):
    json = [JsonSchema(schema={
        'type': 'object',
        'additionalProperties': False,
        'properties': {
            'path': {'type': 'string'},
        },
        'required': ['path'],
    })]
