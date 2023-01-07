import json

filename = "themes/qtlike-dark-theme.json"
# filename = "themes/test.json"

settings = 'settings'
foreground = 'foreground'
fontStyle = 'fontStyle'
scope = 'scope'


class MergeResult:

    def __init__(self, success: bool, merged: dict):
        self.success = success
        self.merged = merged

    success: bool = False
    merged: dict


def make_list(input) -> list:
    if (not isinstance(input, list)):
        input.replace(" ", "")
        return input.split(",")

    return input


def merge_scope_tag(lhs: dict, rhs: dict) -> dict:
    lhs[scope] = make_list(lhs[scope])
    rhs[scope] = make_list(rhs[scope])
    lhs[scope] = lhs[scope] + rhs[scope]
    return lhs


def compare_scope_tag(lhs: dict, rhs: dict) -> bool:

    settings1 = lhs[settings]
    settings2 = rhs[settings]
    if (settings1[foreground] == settings2[foreground]):

        if ((fontStyle in settings1) and (fontStyle in settings2)):  # must match
            if (settings1[fontStyle] == settings2[fontStyle]):
                return True

            return False
        elif (not ((fontStyle in settings1) or (fontStyle in settings2))):  # nothing to match
            return True
        else:  # one has, other doesn't
            return False

    return False


def compare_and_merge(lhs: dict, rhs: dict) -> MergeResult:

    if (compare_scope_tag(lhs, rhs)):
        return MergeResult(True, merge_scope_tag(lhs, rhs))

    return MergeResult


def merge_all_scopes(objects: list) -> list:

    i = 0

    while (i < len(objects)):

        j = i + 1

        while (j < len(objects)):

            later_element = objects[j]
            result = compare_and_merge(objects[i], later_element)

            if (result.success):
                objects[i] = result.merged
                objects.pop(j)
            else:
                j = j + 1

        i = i + 1

    return objects


with open(filename, 'r') as file:

    # Read the json file into a dictionary
    objects = json.load(file)

    # Sort all of the members of "tokenColors" based on the "settings" : "foreground" parameter
    tokenColors = objects['tokenColors']
    tokenColors.sort(key=lambda x: x[settings][foreground])

    # Merge all of the scopes together so that everything with the same colour is in the same object
    merged = merge_all_scopes(tokenColors)


with open(f'{filename} totally merged.json', 'x') as out_file:

    # Save all of the sorted information into a file
    text = json.dumps(merged)
    out_file.write(text)
